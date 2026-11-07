<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationResource;
use App\Models\Book;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/** Les réservations de l'adhérent CONNECTÉ. */
class ReservationController extends Controller
{
    public function __construct(private ReservationService $reservations)
    {
    }

    /**
     * GET /api/my/reservations              → réservations actives (livres prêts en premier)
     * GET /api/my/reservations?status=all   → toutes, y compris l'historique
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', 'in:open,all']]);
        $this->reservations->expireOverdueHolds(); // règle 6 : statuts à jour

        $query = $request->user()->reservations()->with('book');

        if ($request->input('status') === 'all') {
            $query->latest();
        } else {
            // "disponible" avant "en_attente", puis par ancienneté
            $query->open()->orderByRaw("CASE WHEN status = 'disponible' THEN 0 ELSE 1 END")->orderBy('created_at');
        }

        $list = $query->limit(50)->get()->each(
            fn (Reservation $r) => $r->setAttribute('position', $this->reservations->positionOf($r))
        );

        return ReservationResource::collection($list);
    }

    /** POST /api/my/reservations { book_id } — RÈGLES 3 et 5 */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'integer', Rule::exists('books', 'id')->whereNull('deleted_at')],
        ]);

        $book = Book::findOrFail($validated['book_id']);
        $reservation = $this->reservations->reserve($request->user(), $book);
        $position = $this->reservations->positionOf($reservation);
        $reservation->setAttribute('position', $position);

        return (new ReservationResource($reservation->load('book')))
            ->additional([
                'message' => "Réservation enregistrée pour « {$book->title} ». Vous êtes n° {$position} dans la file d'attente.",
            ])
            ->response()
            ->setStatusCode(201);
    }

    /** DELETE /api/my/reservations/{reservation} — annuler */
    public function destroy(Request $request, Reservation $reservation): JsonResponse
    {
        abort_if($reservation->user_id !== $request->user()->id, 404);

        $this->reservations->cancel($reservation);

        return response()->json(['message' => "Votre réservation pour « {$reservation->book->title} » a été annulée."]);
    }
}
