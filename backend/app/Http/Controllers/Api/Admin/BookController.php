<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Gestion du catalogue par le bibliothécaire.
 * Routes protégées par auth:sanctum + role:bibliothecaire (voir routes/api.php).
 * La consultation (liste, fiche) réutilise les routes publiques /api/books.
 */
class BookController extends Controller
{
    /** POST /api/admin/books — ajouter un livre */
    public function store(BookRequest $request): JsonResponse
    {
        $book = Book::create($request->validated());

        return $this->bookResponse($book, 'Le livre a été ajouté au catalogue.', 201);
    }

    /** PUT /api/admin/books/{book} — modifier un livre (dont le nombre d'exemplaires) */
    public function update(BookRequest $request, Book $book): JsonResponse
    {
        $book->update($request->validated());

        return $this->bookResponse($book, 'Le livre a été modifié.');
    }

    /**
     * DELETE /api/admin/books/{book} — retirer un livre du catalogue.
     *
     * RÈGLE 7 : on ne peut pas retirer un livre qui est en cours d'emprunt.
     */
    public function destroy(Book $book): JsonResponse
    {
        $activeLoans = $book->activeLoans()->count();

        if ($activeLoans > 0) {
            throw new BusinessRuleException(
                "Impossible de retirer « {$book->title} » : {$activeLoans} exemplaire(s) sont encore empruntés. "
                .'Enregistrez d\'abord leur retour.'
            );
        }

        // Transaction : les deux opérations réussissent ensemble, ou aucune.
        DB::transaction(function () use ($book) {
            // Les réservations en cours n'ont plus de sens : on les annule.
            $book->reservations()->open()->update(['status' => Reservation::STATUS_ANNULEE]);

            // Soft delete : le livre disparaît du catalogue mais reste dans l'historique.
            $book->delete();
        });

        return response()->json(['message' => "« {$book->title} » a été retiré du catalogue."]);
    }

    private function bookResponse(Book $book, string $message, int $status = 200): JsonResponse
    {
        $book->load('category')->loadCount(['activeLoans', 'heldReservations']);

        return (new BookResource($book))
            ->additional(['message' => $message])
            ->response()
            ->setStatusCode($status);
    }
}
