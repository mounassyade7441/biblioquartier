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
 * Tableau de bord du bibliothécaire.
 * Lancement : php artisan test --filter=DashboardTest
 */
class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_seul_le_bibliothecaire_voit_le_tableau_de_bord(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/admin/dashboard')->assertForbidden();
    }

    public function test_prets_en_cours_retards_et_livres_les_plus_empruntes(): void
    {
        Sanctum::actingAs(User::factory()->bibliothecaire()->create());

        $populaire = Book::factory()->create(['title' => 'Dune', 'total_copies' => 3]);
        $autre = Book::factory()->create(['title' => 'Germinal']);
        $bruno = User::factory()->create(['name' => 'Bruno Durand']);

        Loan::factory()->returned()->count(4)->create(['book_id' => $populaire->id]);
        Loan::factory()->create(['book_id' => $populaire->id]);                          // en cours
        Loan::factory()->overdue()->create(['book_id' => $autre->id, 'user_id' => $bruno->id]); // en retard
        Reservation::factory()->disponible()->create(['book_id' => $populaire->id]);

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            // Prêts en cours (le retard compte aussi comme prêt en cours)
            ->assertJsonPath('data.stats.active_loans', 2)
            // Retards
            ->assertJsonPath('data.stats.overdue_loans', 1)
            ->assertJsonPath('data.stats.members_with_overdue', 1)
            ->assertJsonPath('data.overdue_loans.0.user.name', 'Bruno Durand')
            ->assertJsonPath('data.overdue_loans.0.book.title', 'Germinal')
            // Livres les plus empruntés
            ->assertJsonPath('data.top_books.0.title', 'Dune')
            ->assertJsonPath('data.top_books.0.loans_count', 5)
            // Livres à mettre de côté
            ->assertJsonPath('data.stats.ready_reservations', 1)
            ->assertJsonCount(1, 'data.ready_reservations')
            // Graphique sur 6 mois
            ->assertJsonCount(6, 'data.monthly_loans');
    }

    public function test_tableau_de_bord_vide_sans_erreur(): void
    {
        Sanctum::actingAs(User::factory()->bibliothecaire()->create());

        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.active_loans', 0)
            ->assertJsonPath('data.top_books', []);
    }
}
