<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Tests automatiques de l'authentification.
 * Lancement : php artisan test --filter=AuthTest
 *
 * RefreshDatabase : chaque test démarre sur une base vide (SQLite en mémoire,
 * voir phpunit.xml) → ta base MySQL n'est jamais touchée.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function registrationData(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Sarah Lopez',
            'email' => 'sarah@exemple.fr',
            'password' => 'motdepasse',
            'password_confirmation' => 'motdepasse',
        ], $overrides);
    }

    // ---------- Inscription ----------

    public function test_un_visiteur_peut_creer_un_compte_adherent(): void
    {
        $this->postJson('/api/auth/register', $this->registrationData())
            ->assertCreated()
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'email', 'role']])
            ->assertJsonPath('user.role', 'adherent');

        $this->assertDatabaseHas('users', ['email' => 'sarah@exemple.fr', 'role' => 'adherent']);
    }

    public function test_impossible_de_s_inscrire_en_tant_que_bibliothecaire(): void
    {
        $this->postJson('/api/auth/register', $this->registrationData(['role' => 'bibliothecaire']))
            ->assertCreated()
            ->assertJsonPath('user.role', 'adherent');
    }

    public function test_le_mot_de_passe_n_est_jamais_renvoye(): void
    {
        $this->postJson('/api/auth/register', $this->registrationData())
            ->assertJsonMissingPath('user.password');
    }

    public function test_inscription_refusee_si_l_email_est_deja_utilise(): void
    {
        User::factory()->create(['email' => 'sarah@exemple.fr']);

        $this->postJson('/api/auth/register', $this->registrationData(['email' => 'SARAH@exemple.fr']))
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Un compte existe déjà avec cette adresse e-mail.');
    }

    public function test_inscription_refusee_avec_des_messages_en_francais(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => '',
            'email' => 'pas-un-email',
            'password' => 'court',
            'password_confirmation' => 'different',
        ])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Le champ nom est obligatoire.')
            ->assertJsonPath('errors.email.0', 'Le champ adresse e-mail doit être une adresse e-mail valide.')
            ->assertJsonValidationErrors(['password']);
    }

    // ---------- Connexion ----------

    public function test_connexion_avec_les_bons_identifiants(): void
    {
        User::factory()->create(['email' => 'alice@exemple.fr']); // mot de passe de la factory : "password"

        $this->postJson('/api/auth/login', ['email' => 'alice@exemple.fr', 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_connexion_refusee_avec_un_mauvais_mot_de_passe(): void
    {
        User::factory()->create(['email' => 'alice@exemple.fr']);

        $this->postJson('/api/auth/login', ['email' => 'alice@exemple.fr', 'password' => 'mauvais'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'Adresse e-mail ou mot de passe incorrect.');
    }

    public function test_connexion_bloquee_apres_5_tentatives_en_une_minute(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'x@exemple.fr', 'password' => 'x']);
        }

        $this->postJson('/api/auth/login', ['email' => 'x@exemple.fr', 'password' => 'x'])
            ->assertStatus(429);
    }

    // ---------- Jeton, /me, déconnexion ----------

    public function test_me_exige_d_etre_connecte(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Vous devez être connecté pour accéder à cette page.');
    }

    public function test_me_renvoie_l_utilisateur_grace_au_jeton(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_la_deconnexion_supprime_le_jeton(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    // ---------- Rôles ----------

    public function test_le_middleware_role_filtre_selon_le_role(): void
    {
        // Route créée uniquement pour ce test
        Route::middleware(['api', 'auth:sanctum', 'role:bibliothecaire'])
            ->get('/api/test-role', fn () => ['ok' => true]);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/test-role')
            ->assertForbidden()
            ->assertJsonPath('message', "Vous n'avez pas les droits nécessaires pour accéder à cette ressource.");

        Sanctum::actingAs(User::factory()->bibliothecaire()->create());
        $this->getJson('/api/test-role')->assertOk();
    }
}
