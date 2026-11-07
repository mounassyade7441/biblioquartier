<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Gestion du catalogue par le bibliothécaire (livres + catégories) et règle 7.
 * Lancement : php artisan test --filter=AdminCatalogTest
 */
class AdminCatalogTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsLibrarian(): User
    {
        return Sanctum::actingAs(User::factory()->bibliothecaire()->create());
    }

    private function bookData(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Le Petit Prince',
            'author' => 'Antoine de Saint-Exupéry',
            'summary' => 'Un aviateur rencontre un petit prince.',
            'published_year' => 1943,
            'total_copies' => 2,
            'category_id' => Category::factory()->create()->id,
        ], $overrides);
    }

    // ---------- Sécurité ----------

    public function test_un_visiteur_ne_peut_pas_ajouter_de_livre(): void
    {
        $this->postJson('/api/admin/books', $this->bookData())->assertUnauthorized();
    }

    public function test_un_adherent_ne_peut_pas_ajouter_de_livre(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/admin/books', $this->bookData())->assertForbidden();
        $this->assertDatabaseCount('books', 0);
    }

    // ---------- Livres ----------

    public function test_le_bibliothecaire_ajoute_un_livre_avec_son_nombre_d_exemplaires(): void
    {
        $this->actingAsLibrarian();

        $this->postJson('/api/admin/books', $this->bookData(['total_copies' => 4]))
            ->assertCreated()
            ->assertJsonPath('message', 'Le livre a été ajouté au catalogue.')
            ->assertJsonPath('data.total_copies', 4)
            ->assertJsonPath('data.available_copies', 4);

        $this->assertDatabaseHas('books', ['title' => 'Le Petit Prince', 'total_copies' => 4]);
    }

    public function test_ajout_refuse_si_champs_invalides_avec_messages_en_francais(): void
    {
        $this->actingAsLibrarian();

        $this->postJson('/api/admin/books', ['title' => '', 'total_copies' => 0, 'category_id' => 999])
            ->assertStatus(422)
            ->assertJsonPath('errors.title.0', 'Le champ titre est obligatoire.')
            ->assertJsonPath('errors.author.0', 'Le champ auteur est obligatoire.')
            ->assertJsonPath('errors.total_copies.0', "Le champ nombre d'exemplaires doit être au moins égal à 1.")
            ->assertJsonPath('errors.category_id.0', "La valeur sélectionnée pour catégorie n'existe pas.");
    }

    public function test_le_bibliothecaire_modifie_un_livre(): void
    {
        $this->actingAsLibrarian();
        $book = Book::factory()->create(['total_copies' => 1]);

        $this->putJson("/api/admin/books/{$book->id}", $this->bookData(['title' => 'Nouveau titre', 'total_copies' => 5]))
            ->assertOk()
            ->assertJsonPath('data.title', 'Nouveau titre')
            ->assertJsonPath('data.total_copies', 5);
    }

    public function test_impossible_de_descendre_sous_le_nombre_d_exemplaires_en_circulation(): void
    {
        $this->actingAsLibrarian();
        $book = Book::factory()->create(['total_copies' => 3]);
        Loan::factory()->count(2)->create(['book_id' => $book->id]);

        $this->putJson("/api/admin/books/{$book->id}", $this->bookData(['total_copies' => 1]))
            ->assertStatus(422)
            ->assertJsonPath('errors.total_copies.0', 'Impossible : 2 exemplaire(s) sont actuellement empruntés ou mis de côté.');
    }

    public function test_regle_7_impossible_de_retirer_un_livre_en_cours_d_emprunt(): void
    {
        $this->actingAsLibrarian();
        $book = Book::factory()->create(['title' => 'Dune']);
        Loan::factory()->create(['book_id' => $book->id]);

        $this->deleteJson("/api/admin/books/{$book->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', "Impossible de retirer « Dune » : 1 exemplaire(s) sont encore empruntés. Enregistrez d'abord leur retour.");

        $this->assertNotSoftDeleted($book);
    }

    public function test_retirer_un_livre_sans_emprunt_garde_l_historique_et_annule_les_reservations(): void
    {
        $this->actingAsLibrarian();
        $book = Book::factory()->create();
        $oldLoan = Loan::factory()->returned()->create(['book_id' => $book->id]);
        $reservation = Reservation::factory()->create(['book_id' => $book->id]);

        $this->deleteJson("/api/admin/books/{$book->id}")->assertOk();

        $this->assertSoftDeleted($book);                         // retiré du catalogue…
        $this->assertDatabaseHas('loans', ['id' => $oldLoan->id]); // …mais l'historique reste
        $this->assertSame(Reservation::STATUS_ANNULEE, $reservation->fresh()->status);
    }

    // ---------- Catégories ----------

    public function test_le_bibliothecaire_cree_une_categorie_et_le_slug_est_genere(): void
    {
        $this->actingAsLibrarian();

        $this->postJson('/api/admin/categories', ['name' => 'Science-fiction'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'science-fiction');
    }

    public function test_une_categorie_ne_peut_pas_exister_en_double(): void
    {
        $this->actingAsLibrarian();
        Category::factory()->create(['name' => 'Roman', 'slug' => 'roman']);

        $this->postJson('/api/admin/categories', ['name' => 'Roman'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Cette catégorie existe déjà.');
    }

    public function test_le_bibliothecaire_renomme_une_categorie(): void
    {
        $this->actingAsLibrarian();
        $category = Category::factory()->create(['name' => 'BD', 'slug' => 'bd']);

        $this->putJson("/api/admin/categories/{$category->id}", ['name' => 'Bandes dessinées'])
            ->assertOk()
            ->assertJsonPath('data.slug', 'bandes-dessinees');
    }

    public function test_impossible_de_supprimer_une_categorie_qui_contient_des_livres(): void
    {
        $this->actingAsLibrarian();
        $category = Category::factory()->create();
        Book::factory()->create(['category_id' => $category->id]);

        $this->deleteJson("/api/admin/categories/{$category->id}")->assertStatus(422);
        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_supprimer_une_categorie_vide(): void
    {
        $this->actingAsLibrarian();
        $category = Category::factory()->create();

        $this->deleteJson("/api/admin/categories/{$category->id}")->assertOk();
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
