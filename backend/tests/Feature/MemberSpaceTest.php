<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Espace adhérent : emprunts, prolongation (règle 4), réservations (règles 3, 5, 6).
 * Lancement : php artisan test --filter=MemberSpaceTest
 */
class MemberSpaceTest extends TestCase
{
    use RefreshDatabase;

    private User $me;

    protected function setUp(): void
    {
        parent::setUp();
        $this->me = User::factory()->create(['name' => 'Alice Martin']);
        Sanctum::actingAs($this->me);
    }

    /** Un livre dont l'unique exemplaire est emprunté par quelqu'un d'autre. */
    private function borrowedBook(): Book
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        Loan::factory()->create(['book_id' => $book->id]);

        return $book;
    }

    // ---------- Sécurité : chacun n'accède qu'à ce qui le concerne ----------

    public function test_un_visiteur_n_a_pas_acces_a_l_espace_adherent(): void
    {
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/my/loans', ['Authorization' => ''])->assertUnauthorized();
    }

    public function test_un_bibliothecaire_n_a_pas_d_espace_adherent(): void
    {
        Sanctum::actingAs(User::factory()->bibliothecaire()->create());
        $this->getJson('/api/my/loans')->assertForbidden();
    }

    public function test_un_adherent_ne_voit_que_ses_propres_emprunts(): void
    {
        Loan::factory()->create(['user_id' => $this->me->id]);
        Loan::factory()->count(3)->create(); // emprunts d'autres adhérents

        $this->getJson('/api/my/loans')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_un_adherent_ne_peut_pas_prolonger_l_emprunt_d_un_autre(): void
    {
        $other = Loan::factory()->create();

        $this->postJson("/api/my/loans/{$other->id}/extend")->assertNotFound();
    }

    public function test_un_adherent_ne_peut_pas_annuler_la_reservation_d_un_autre(): void
    {
        $other = Reservation::factory()->create();

        $this->deleteJson("/api/my/reservations/{$other->id}")->assertNotFound();
        $this->assertSame(Reservation::STATUS_EN_ATTENTE, $other->fresh()->status);
    }

    // ---------- Emprunts en cours, retard, historique ----------

    public function test_emprunts_en_cours_avec_date_de_retour_et_alerte_de_retard(): void
    {
        Loan::factory()->create(['user_id' => $this->me->id]);
        Loan::factory()->overdue()->create(['user_id' => $this->me->id]);

        $response = $this->getJson('/api/my/loans')->assertOk()->assertJsonCount(2, 'data');

        // Le retard arrive en premier (date limite la plus ancienne)
        $response->assertJsonPath('data.0.status', 'en_retard')
            ->assertJsonPath('data.0.is_overdue', true)
            ->assertJsonPath('data.1.status', 'en_cours')
            ->assertJsonStructure(['data' => [['due_at', 'days_left', 'days_overdue', 'can_extend', 'book' => ['title']]]]);
    }

    public function test_historique_des_anciens_emprunts(): void
    {
        Loan::factory()->returned()->count(4)->create(['user_id' => $this->me->id]);
        Loan::factory()->create(['user_id' => $this->me->id]); // en cours : pas dans l'historique

        $this->getJson('/api/my/loans?status=history')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.status', 'rendu');
    }

    public function test_resume_de_l_espace_adherent(): void
    {
        Loan::factory()->overdue()->create(['user_id' => $this->me->id]);
        Reservation::factory()->disponible()->create(['user_id' => $this->me->id]);

        $this->getJson('/api/my/summary')
            ->assertOk()
            ->assertJsonPath('data.active_loans_count', 1)
            ->assertJsonPath('data.overdue_count', 1)
            ->assertJsonPath('data.can_borrow', false)
            ->assertJsonPath('data.can_reserve', false)
            ->assertJsonPath('data.ready_reservations_count', 1);
    }

    // ---------- Règle 4 : prolongation ----------

    public function test_regle_4_prolonger_un_emprunt_d_une_semaine(): void
    {
        $loan = Loan::factory()->create(['user_id' => $this->me->id]);
        $initialDue = $loan->due_at->copy();

        $this->postJson("/api/my/loans/{$loan->id}/extend")
            ->assertOk()
            ->assertJsonPath('data.extended', true)
            ->assertJsonPath('data.can_extend', false);

        $this->assertTrue($loan->fresh()->due_at->equalTo($initialDue->addDays(7)));
    }

    public function test_regle_4_une_seule_prolongation(): void
    {
        $loan = Loan::factory()->create(['user_id' => $this->me->id, 'extended' => true]);

        $this->postJson("/api/my/loans/{$loan->id}/extend")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Cet emprunt a déjà été prolongé une fois : une seule prolongation est possible.');
    }

    public function test_regle_4_pas_de_prolongation_si_deja_en_retard(): void
    {
        $loan = Loan::factory()->overdue()->create(['user_id' => $this->me->id]);

        $this->postJson("/api/my/loans/{$loan->id}/extend")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Cet emprunt est en retard : il ne peut plus être prolongé. Merci de rapporter le livre au plus vite.');
    }

    public function test_regle_4_pas_de_prolongation_si_quelqu_un_attend_le_livre(): void
    {
        $loan = Loan::factory()->create(['user_id' => $this->me->id]);
        Reservation::factory()->create(['book_id' => $loan->book_id]);

        $this->getJson('/api/my/loans')
            ->assertJsonPath('data.0.can_extend', false)
            ->assertJsonPath('data.0.extend_blocked_reason', "D'autres adhérents attendent ce livre : il ne peut pas être prolongé.");

        $this->postJson("/api/my/loans/{$loan->id}/extend")->assertStatus(422);
    }

    // ---------- Règle 5 : réserver ----------

    public function test_regle_5_reserver_un_livre_entierement_emprunte(): void
    {
        $book = $this->borrowedBook();

        $this->postJson('/api/my/reservations', ['book_id' => $book->id])
            ->assertCreated()
            ->assertJsonPath('data.status', 'en_attente')
            ->assertJsonPath('data.position', 1);
    }

    public function test_regle_5_impossible_de_reserver_un_livre_disponible(): void
    {
        $book = Book::factory()->create(['total_copies' => 2]);
        Loan::factory()->create(['book_id' => $book->id]); // 1 exemplaire encore libre

        $this->postJson('/api/my/reservations', ['book_id' => $book->id])
            ->assertStatus(422)
            ->assertJsonPath('message', "Ce livre est disponible : inutile de le réserver, venez l'emprunter directement à la bibliothèque.");
    }

    public function test_regle_5_la_file_respecte_l_ordre_d_arrivee(): void
    {
        $book = $this->borrowedBook();
        Reservation::factory()->create(['book_id' => $book->id, 'created_at' => now()->subDay()]);

        $this->postJson('/api/my/reservations', ['book_id' => $book->id])
            ->assertCreated()
            ->assertJsonPath('data.position', 2)
            ->assertJsonPath('message', "Réservation enregistrée pour « {$book->title} ». Vous êtes n° 2 dans la file d'attente.");
    }

    public function test_impossible_de_reserver_deux_fois_le_meme_livre(): void
    {
        $book = $this->borrowedBook();
        $this->postJson('/api/my/reservations', ['book_id' => $book->id])->assertCreated();

        $this->postJson('/api/my/reservations', ['book_id' => $book->id])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Vous avez déjà réservé ce livre.');
    }

    public function test_regle_3_un_adherent_en_retard_ne_peut_plus_reserver(): void
    {
        Loan::factory()->overdue()->create(['user_id' => $this->me->id]);

        $this->postJson('/api/my/reservations', ['book_id' => $this->borrowedBook()->id])
            ->assertStatus(422)
            ->assertJsonPath('message', "Vous avez un livre en retard : vous ne pouvez plus réserver tant que vous ne l'avez pas rendu.");
    }

    // ---------- Annuler + règle 6 ----------

    public function test_annuler_une_reservation(): void
    {
        $reservation = Reservation::factory()->create(['user_id' => $this->me->id]);

        $this->deleteJson("/api/my/reservations/{$reservation->id}")->assertOk();
        $this->assertSame(Reservation::STATUS_ANNULEE, $reservation->fresh()->status);
    }

    public function test_annuler_un_livre_mis_de_cote_le_passe_au_suivant_de_la_file(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        $mine = Reservation::factory()->disponible()->create(['user_id' => $this->me->id, 'book_id' => $book->id]);
        $next = Reservation::factory()->create(['book_id' => $book->id]);

        $this->deleteJson("/api/my/reservations/{$mine->id}")->assertOk();

        $this->assertSame(Reservation::STATUS_DISPONIBLE, $next->fresh()->status);
    }

    public function test_mes_reservations_avec_position_et_livres_prets_en_premier(): void
    {
        $waiting = $this->borrowedBook();
        Reservation::factory()->create(['book_id' => $waiting->id, 'created_at' => now()->subDays(2)]);
        Reservation::factory()->create(['user_id' => $this->me->id, 'book_id' => $waiting->id]);
        Reservation::factory()->disponible()->create(['user_id' => $this->me->id]);

        $this->getJson('/api/my/reservations')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.status', 'disponible')
            ->assertJsonPath('data.1.status', 'en_attente')
            ->assertJsonPath('data.1.position', 2);
    }

    // ---------- Fiche livre vue par un adhérent connecté ----------

    public function test_la_fiche_livre_indique_a_l_adherent_s_il_peut_reserver(): void
    {
        $book = $this->borrowedBook();

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('viewer.can_reserve', true)
            ->assertJsonPath('viewer.reservation', null);
    }

    // ---------- Tâche planifiée (règle 6) ----------

    public function test_la_commande_reservations_expire(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        $expired = Reservation::factory()->disponible()->create(['book_id' => $book->id]);
        $this->travel(4)->days();

        $this->artisan('reservations:expire')->assertSuccessful();

        $this->assertSame(Reservation::STATUS_EXPIREE, $expired->fresh()->status);
    }
}
