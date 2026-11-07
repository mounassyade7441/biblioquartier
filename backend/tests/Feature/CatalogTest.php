<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\Loan;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Catalogue public (visiteur).
 * Lancement : php artisan test --filter=CatalogTest
 */
class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_visiteur_peut_parcourir_le_catalogue_pagine(): void
    {
        Book::factory()->count(15)->create();

        $this->getJson('/api/books')
            ->assertOk()
            ->assertJsonCount(12, 'data')                 // 12 livres par page
            ->assertJsonPath('meta.total', 15)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonStructure(['data' => [['id', 'title', 'author', 'category', 'available_copies', 'is_available']]]);
    }

    public function test_recherche_par_titre(): void
    {
        Book::factory()->create(['title' => 'Dune', 'author' => 'Frank Herbert']);
        Book::factory()->create(['title' => 'Germinal', 'author' => 'Émile Zola']);

        $this->getJson('/api/books?search=dun')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Dune');
    }

    public function test_recherche_par_auteur(): void
    {
        Book::factory()->create(['title' => 'Dune', 'author' => 'Frank Herbert']);
        Book::factory()->create(['title' => 'Germinal', 'author' => 'Émile Zola']);

        $this->getJson('/api/books?search=Zola')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Germinal');
    }

    public function test_filtre_par_categorie(): void
    {
        $bd = Category::factory()->create(['name' => 'BD', 'slug' => 'bd']);
        Book::factory()->count(2)->create(['category_id' => $bd->id]);
        Book::factory()->count(3)->create(); // autres catégories

        $this->getJson('/api/books?category=bd')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_la_disponibilite_tient_compte_des_emprunts_et_des_livres_mis_de_cote(): void
    {
        $book = Book::factory()->create(['total_copies' => 3]);
        Loan::factory()->create(['book_id' => $book->id]);                     // 1 exemplaire emprunté
        Reservation::factory()->disponible()->create(['book_id' => $book->id]); // 1 exemplaire mis de côté
        Loan::factory()->returned()->create(['book_id' => $book->id]);          // rendu : ne compte pas

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.total_copies', 3)
            ->assertJsonPath('data.available_copies', 1)
            ->assertJsonPath('data.is_available', true);
    }

    public function test_un_livre_entierement_emprunte_indique_la_date_de_retour_et_la_file(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        Loan::factory()->create(['book_id' => $book->id]);
        Reservation::factory()->count(2)->create(['book_id' => $book->id]);

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.is_available', false)
            ->assertJsonPath('data.waiting_count', 2)
            ->assertJsonPath('data.next_return_overdue', false)
            ->assertJsonStructure(['data' => ['next_return_at']]);
    }

    public function test_la_fiche_signale_un_retour_deja_en_retard(): void
    {
        $book = Book::factory()->create(['total_copies' => 1]);
        Loan::factory()->overdue()->create(['book_id' => $book->id]);

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.next_return_overdue', true);
    }

    public function test_filtre_disponibles_uniquement(): void
    {
        $libre = Book::factory()->create(['total_copies' => 1]);
        $sorti = Book::factory()->create(['total_copies' => 1]);
        Loan::factory()->create(['book_id' => $sorti->id]);

        $this->getJson('/api/books?available=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $libre->id);
    }

    public function test_un_livre_retire_du_catalogue_n_apparait_plus(): void
    {
        $book = Book::factory()->create();
        $book->delete(); // soft delete

        $this->getJson('/api/books')->assertJsonCount(0, 'data');
        $this->getJson("/api/books/{$book->id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'Ressource introuvable.');
    }

    public function test_liste_des_categories_avec_nombre_de_livres(): void
    {
        $roman = Category::factory()->create(['name' => 'Roman', 'slug' => 'roman']);
        Book::factory()->count(2)->create(['category_id' => $roman->id]);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Roman')
            ->assertJsonPath('data.0.books_count', 2);
    }

    public function test_parametre_de_tri_invalide_refuse(): void
    {
        $this->getJson('/api/books?sort=nimportequoi')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sort');
    }
}
