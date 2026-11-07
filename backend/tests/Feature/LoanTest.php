<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Prêts et retours (bibliothécaire) — règles 1, 2, 3 et 6.
 * Lancement : php artisan test --filter=LoanTest
 */
class LoanTest extends TestCase
{
    use RefreshDatabase;

    private User $member;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->bibliothecaire()->create());
        $this->member = User::factory()->create(['name' => 'Alice Martin']);
    }

    private function checkout(User $user, Book $book)
    {
        return $this->postJson('/api/admin/loans', ['user_id' => $user->id, 'book_id' => $book->id]);
    }

    // ---------- Sécurité ----------

    public function test_un_adherent_ne_peut_pas_enregistrer_de_pret(): void
    {
        Sanctum::actingAs($this->member);

        $this->checkout($this->member, Book::factory()->create())->assertForbidden();
    }

    // ---------- Règle 1 : 3 semaines ----------

    public function test_regle_1_un_emprunt_dure_3_semaines(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 7)->setTime(10, 0));
        $book = Book::factory()->create(['title' => 'Dune']);

        $this->checkout($this->member, $book)
            ->assertCreated()
            ->assertJsonPath('message', 'Prêt enregistré : « Dune » pour Alice Martin, à rendre au plus tard le 28/11/2026.')
            ->assertJsonPath('data.status', 'en_cours')
            ->assertJsonPath('data.days_left', 21);
    }

    // ---------- Règle 2 : 3 livres maximum ----------

    public function test_regle_2_pas_plus_de_3_livres_en_meme_temps(): void
    {
        Loan::factory()->count(3)->create(['user_id' => $this->member->id]);

        $this->checkout($this->member, Book::factory()->create())
            ->assertStatus(422)
            ->assertJsonPath('message', "Alice Martin a déjà 3 livres empruntés : c'est le maximum autorisé.");
    }

    public function test_regle_2_les_livres_rendus_ne_comptent_pas(): void
    {
        Loan::factory()->count(2)->create(['user_id' => $this->member->id]);
        Loan::factory()->returned()->count(5)->create(['user_id' => $this->member->id]);

        $this->checkout($this->member, Book::factory()->create())->assertCreated();
    }

    // ---------- Règle 3 : bloqué en cas de retard ----------

    public function test_regle_3_un_adherent_en_retard_ne_peut_plus_emprunter(): void
    {
        Loan::factory()->overdue()->create(['user_id' => $this->member->id]);

        $this->checkout($this->member, Book::factory()->create())
            ->assertStatus(422)
            ->assertJsonPath('message', "Alice Martin a un livre en retard : aucun nouvel emprunt n'est possible tant qu'il n'a pas été rendu.");
    }

    public function test_regle_3_une_fois_le_livre_en_retard_rendu_l_adherent_peut_emprunter(): void
    {
        $late = Loan::factory()->overdue()->create(['user_id' => $this->member->id]);
        $this->postJson("/api/admin/loans/{$late->id}/return")->assertOk();

        $this->checkout($this->member, Book::factory()->create())->assertCreated();
    }

    // ---------- Disponibilité ----------

    public function test_impossible_d_emprunter_un_livre_sans_exemplaire_libre(): void
    {
        $book = Book::factory()->create(['title' => 'Dune', 'total_copies' => 1]);
        Loan::factory()->create(['book_id' => $book->id]);

        $this->checkout($this->member, $book)
            ->assertStatus(422)
            ->assertJsonPath('message', "Aucun exemplaire de « Dune » n'est disponible.");
    }

    public function test_un_livre_mis_de_cote_ne_peut_etre_prete_qu_a_celui_qui_l_a_reserve(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        $other = User::factory()->create();
        $reservation = Reservation::factory()->disponible()->create(['book_id' => $book->id, 'user_id' => $other->id]);

        $this->checkout($this->member, $book)->assertStatus(422);  // pas pour Alice…
        $this->checkout($other, $book)->assertCreated();          // …mais pour celui qui l'a réservé

        $this->assertSame(Reservation::STATUS_HONOREE, $reservation->fresh()->status);
    }

    public function test_un_adherent_ne_peut_pas_emprunter_deux_fois_le_meme_livre(): void
    {
        $book = Book::factory()->create(['total_copies' => 3]);
        $this->checkout($this->member, $book)->assertCreated();

        $this->checkout($this->member, $book)->assertStatus(422);
    }

    public function test_un_bibliothecaire_ne_peut_pas_etre_emprunteur(): void
    {
        $librarian = User::factory()->bibliothecaire()->create();

        $this->checkout($librarian, Book::factory()->create())
            ->assertStatus(422)
            ->assertJsonValidationErrors('user_id');
    }

    // ---------- Retour + règle 6 ----------

    public function test_enregistrer_un_retour_rend_le_livre_disponible(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        $loan = Loan::factory()->create(['book_id' => $book->id]);

        $this->postJson("/api/admin/loans/{$loan->id}/return")
            ->assertOk()
            ->assertJsonPath('data.status', 'rendu')
            ->assertJsonPath('held_for', null);

        $this->assertSame(1, $book->fresh()->availableCopies());
    }

    public function test_un_livre_ne_peut_pas_etre_rendu_deux_fois(): void
    {
        $loan = Loan::factory()->returned()->create();

        $this->postJson("/api/admin/loans/{$loan->id}/return")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Ce livre a déjà été rendu.');
    }

    public function test_regle_6_au_retour_le_livre_est_mis_de_cote_pour_le_premier_de_la_file(): void
    {
        $this->travelTo(now()->setDate(2026, 11, 7)->setTime(10, 0));
        $book = Book::factory()->create(['total_copies' => 1]);
        $loan = Loan::factory()->create(['book_id' => $book->id]);

        $emma = User::factory()->create(['name' => 'Emma Leroy']);
        $hugo = User::factory()->create(['name' => 'Hugo Moreau']);
        $first = Reservation::factory()->create(['book_id' => $book->id, 'user_id' => $emma->id, 'created_at' => now()->subDays(4)]);
        $second = Reservation::factory()->create(['book_id' => $book->id, 'user_id' => $hugo->id, 'created_at' => now()->subDays(2)]);

        $this->postJson("/api/admin/loans/{$loan->id}/return")
            ->assertOk()
            ->assertJsonPath('held_for.name', 'Emma Leroy')
            ->assertJsonPath('message', 'Retour enregistré : « '.$book->title.' ». Ce livre est réservé : mettez-le de côté pour Emma Leroy jusqu\'au 10/11/2026.');

        $this->assertSame(Reservation::STATUS_DISPONIBLE, $first->fresh()->status);
        $this->assertSame(Reservation::STATUS_EN_ATTENTE, $second->fresh()->status); // Hugo attend toujours
        $this->assertSame(0, $book->fresh()->availableCopies());                      // pas pour les autres
    }

    public function test_regle_6_apres_3_jours_la_reservation_expire_et_passe_au_suivant(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        $emma = Reservation::factory()->disponible()->create(['book_id' => $book->id, 'created_at' => now()->subDays(10)]);
        $hugo = Reservation::factory()->create(['book_id' => $book->id, 'created_at' => now()->subDays(5)]);

        $this->travel(4)->days(); // Emma n'est pas venue chercher son livre

        app(ReservationService::class)->expireOverdueHolds();

        $this->assertSame(Reservation::STATUS_EXPIREE, $emma->fresh()->status);
        $this->assertSame(Reservation::STATUS_DISPONIBLE, $hugo->fresh()->status);
    }

    public function test_regle_6_ajouter_un_exemplaire_le_met_de_cote_pour_la_file(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        Loan::factory()->create(['book_id' => $book->id]);
        $waiting = Reservation::factory()->create(['book_id' => $book->id]);

        $this->putJson("/api/admin/books/{$book->id}", [
            'title' => $book->title, 'author' => $book->author,
            'total_copies' => 2, 'category_id' => $book->category_id,
        ])->assertOk();

        $this->assertSame(Reservation::STATUS_DISPONIBLE, $waiting->fresh()->status);
    }

    // ---------- Listes ----------

    public function test_liste_des_prets_en_retard(): void
    {
        Loan::factory()->count(2)->create();
        Loan::factory()->overdue()->create(['user_id' => $this->member->id]);

        $this->getJson('/api/admin/loans?status=overdue')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.name', 'Alice Martin')
            ->assertJsonPath('data.0.status', 'en_retard');
    }

    public function test_recherche_d_un_adherent_pour_un_pret(): void
    {
        $this->member->update(['email' => 'alice@exemple.fr']);
        Loan::factory()->overdue()->create(['user_id' => $this->member->id]);
        // E-mail fixé : un e-mail aléatoire pourrait contenir "alice" et fausser le test
        User::factory()->create(['name' => 'Bruno Durand', 'email' => 'bruno@exemple.fr']);

        $this->getJson('/api/admin/members?search=alice')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.active_loans_count', 1)
            ->assertJsonPath('data.0.has_overdue_loans', true);
    }
}
