<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Reservation;
use Illuminate\Support\Collection;

/**
 * Règles de fonctionnement liées aux RÉSERVATIONS.
 *
 * Étape 7 : la file d'attente (règle 6).
 * Étape 8 : réserver, annuler (règle 5) viendront s'ajouter ici.
 */
class ReservationService
{
    /**
     * RÈGLE 6 — Quand un exemplaire se libère (retour, ajout d'exemplaires, réservation expirée),
     * il est mis de côté pour le PREMIER adhérent de la file, qui a 3 jours pour venir le chercher.
     *
     * @return Collection<int, Reservation> les réservations qui viennent de passer "disponible"
     */
    public function assignAvailableCopies(Book $book): Collection
    {
        // Calcul "frais" depuis la base (on n'utilise pas d'éventuels compteurs déjà chargés)
        $free = $book->total_copies
            - $book->activeLoans()->count()
            - $book->heldReservations()->count();

        if ($free <= 0) {
            return collect();
        }

        // Les $free premiers de la file, par ordre d'arrivée (règle 5)
        $next = $book->waitingReservations()->limit($free)->get();

        foreach ($next as $reservation) {
            $reservation->update([
                'status' => Reservation::STATUS_DISPONIBLE,
                'available_at' => now(),
                'expires_at' => now()->addDays(Reservation::HOLD_DAYS),
            ]);
        }

        return $next;
    }

    /**
     * RÈGLE 6 (suite) — "Passé ce délai, la réservation est annulée."
     * Les réservations mises de côté depuis plus de 3 jours passent "expiree",
     * et l'exemplaire est aussitôt proposé au suivant de la file.
     *
     * Appelée avant chaque prêt / réservation, et chaque heure par le planificateur (étape 8).
     *
     * @return int nombre de réservations expirées
     */
    public function expireOverdueHolds(): int
    {
        $expired = Reservation::where('status', Reservation::STATUS_DISPONIBLE)
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expired as $reservation) {
            $reservation->update(['status' => Reservation::STATUS_EXPIREE]);
        }

        // L'exemplaire libéré passe au suivant de la file
        foreach ($expired->pluck('book_id')->unique() as $bookId) {
            if ($book = Book::find($bookId)) {
                $this->assignAvailableCopies($book);
            }
        }

        return $expired->count();
    }
}
