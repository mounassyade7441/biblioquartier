<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Book;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Règles de fonctionnement liées aux RÉSERVATIONS (règles 3, 5 et 6).
 */
class ReservationService
{
    /**
     * Pourquoi cet adhérent ne peut-il PAS réserver ce livre ?
     * Renvoie null s'il le peut. Sert à reserve() ET à l'affichage du bouton "Réserver".
     */
    public function reserveBlockedReason(User $user, Book $book): ?string
    {
        if (! $user->isAdherent()) {
            return 'Seuls les adhérents peuvent réserver des livres.';
        }
        // RÈGLE 3 : un adhérent en retard ne peut plus réserver
        if ($user->hasOverdueLoans()) {
            return "Vous avez un livre en retard : vous ne pouvez plus réserver tant que vous ne l'avez pas rendu.";
        }
        if ($user->activeLoans()->where('book_id', $book->id)->exists()) {
            return 'Vous avez déjà ce livre en votre possession.';
        }
        if ($user->reservations()->open()->where('book_id', $book->id)->exists()) {
            return 'Vous avez déjà réservé ce livre.';
        }
        // RÈGLE 5 : on ne réserve que si TOUS les exemplaires sont déjà empruntés (ou mis de côté)
        if ($book->availableCopies() > 0) {
            return "Ce livre est disponible : inutile de le réserver, venez l'emprunter directement à la bibliothèque.";
        }

        return null;
    }

    /** RÈGLE 5 — Réserver : l'adhérent prend place à la fin de la file d'attente. */
    public function reserve(User $user, Book $book): Reservation
    {
        return DB::transaction(function () use ($user, $book) {
            $book = Book::whereKey($book->id)->lockForUpdate()->firstOrFail();
            $this->expireOverdueHolds();

            if ($reason = $this->reserveBlockedReason($user, $book)) {
                throw new BusinessRuleException($reason);
            }

            // created_at = "maintenant" → c'est lui qui fixe l'ordre d'arrivée dans la file
            return Reservation::create([
                'user_id' => $user->id,
                'book_id' => $book->id,
                'status' => Reservation::STATUS_EN_ATTENTE,
            ]);
        });
    }

    /** Annuler une réservation. Si le livre était mis de côté, il passe au suivant de la file. */
    public function cancel(Reservation $reservation): void
    {
        if (! in_array($reservation->status, [Reservation::STATUS_EN_ATTENTE, Reservation::STATUS_DISPONIBLE], true)) {
            throw new BusinessRuleException("Cette réservation n'est plus active : elle ne peut pas être annulée.");
        }

        DB::transaction(function () use ($reservation) {
            $wasHeld = $reservation->status === Reservation::STATUS_DISPONIBLE;
            $reservation->update(['status' => Reservation::STATUS_ANNULEE]);

            if ($wasHeld) {
                $this->assignAvailableCopies($reservation->book); // règle 6
            }
        });
    }

    /** Place dans la file d'attente (1 = le prochain servi). Null si la réservation n'est pas en attente. */
    public function positionOf(Reservation $reservation): ?int
    {
        if ($reservation->status !== Reservation::STATUS_EN_ATTENTE) {
            return null;
        }

        $before = Reservation::where('book_id', $reservation->book_id)
            ->where('status', Reservation::STATUS_EN_ATTENTE)
            ->where(function ($q) use ($reservation) {
                $q->where('created_at', '<', $reservation->created_at)
                  ->orWhere(fn ($q) => $q->where('created_at', $reservation->created_at)->where('id', '<', $reservation->id));
            })
            ->count();

        return $before + 1;
    }

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
