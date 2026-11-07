<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Catalogue côté public : accessible à tous, même sans être connecté. */
class BookController extends Controller
{
    /**
     * GET /api/books
     *
     * Paramètres (tous facultatifs) :
     *   ?search=dune          recherche dans le titre ou l'auteur
     *   ?category=roman       slug de la catégorie
     *   ?available=1          seulement les livres disponibles
     *   ?sort=title|recent|popular|author
     *   ?page=2&per_page=12   pagination
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:title,author,recent,popular'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Book::query()
            ->with('category')
            ->withAvailability()
            ->search($validated['search'] ?? null)
            ->inCategory($validated['category'] ?? null);

        if ($request->boolean('available')) {
            $query->available();
        }

        match ($validated['sort'] ?? 'title') {
            'author' => $query->orderBy('author')->orderBy('title'),
            'recent' => $query->latest(),                                   // derniers ajoutés
            'popular' => $query->withCount('loans')->orderByDesc('loans_count')->orderBy('title'),
            default => $query->orderBy('title'),
        };

        $books = $query->paginate($validated['per_page'] ?? 12)->withQueryString();

        // Renvoie { data: [...], links: {...}, meta: { current_page, last_page, total, ... } }
        return BookResource::collection($books);
    }

    /**
     * GET /api/books/{book}
     * Grâce au "route model binding", Laravel charge le livre automatiquement
     * (ou renvoie 404 s'il n'existe pas ou a été retiré du catalogue).
     */
    public function show(Book $book): BookResource
    {
        $book->load('category')
            ->loadCount([
                'activeLoans',
                'heldReservations',
                'reservations as waiting_count' => fn ($q) => $q->where('status', Reservation::STATUS_EN_ATTENTE),
            ])
            ->loadMin('activeLoans', 'due_at'); // → active_loans_min_due_at (prochain retour prévu)

        return new BookResource($book);
    }
}
