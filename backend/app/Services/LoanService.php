<?php

namespace App\Services;

use App\Exceptions\BusinessRuleException;
use App\Models\Book;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Règles de fonctionnement liées aux EMPRUNTS.
 *
 * Toutes les règles sont vérifiées ICI, côté serveur : même si quelqu'un
 * contourne l'interface React (Postman, curl…), elles s'appliquent.
 */
class LoanService
{
    // Laravel fournit automatiquement le ReservationService (injection de dépendances)
    public function __construct(private ReservationService $reservations)
    {
    }

    /**
     * Enregistre un prêt : un adhérent repart avec un livre.
     *
     * @throws BusinessRuleException si une règle n'est pas respectée
     */
    public function checkout(User $user, Book $book): Loan
    {
        return DB::transaction(function () use ($user, $book) {
            // Verrouille la ligne du livre jusqu'à la fin de la transaction :
            // deux bibliothécaires ne peuvent pas prêter le dernier exemplaire en même temps.
            $book = Book::whereKey($book->id)->lockForUpdate()->firstOrFail();

            // Règle 6 : on libère d'abord les livres mis de côté depuis plus de 3 jours
            $this->reservations->expireOverdueHolds();

            if (! $user->isAdherent()) {
                throw new BusinessRuleException('Seuls les adhérents peuvent emprunter des livres.');
            }

            // RÈGLE 3 : un adhérent en retard ne peut plus emprunter
            if ($user->hasOverdueLoans()) {
                throw new BusinessRuleException(
                    "{$user->name} a un livre en retard : aucun nouvel emprunt n'est possible tant qu'il n'a pas été rendu."
                );
            }

            // RÈGLE 2 : 3 livres maximum en même temps
            if ($user->activeLoans()->count() >= Loan::MAX_ACTIVE) {
                throw new BusinessRuleException(
                    "{$user->name} a déjà ".Loan::MAX_ACTIVE.' livres empruntés : c\'est le maximum autorisé.'
                );
            }

            if ($user->activeLoans()->where('book_id', $book->id)->exists()) {
                throw new BusinessRuleException("{$user->name} a déjà emprunté « {$book->title} ».");
            }

            // Disponibilité : soit un exemplaire est libre, soit un exemplaire est mis de côté POUR LUI
            $heldForUser = $book->heldReservations()->where('user_id', $user->id)->first();

            if (! $heldForUser && $book->availableCopies() === 0) {
                $message = "Aucun exemplaire de « {$book->title} » n'est disponible.";
                if ($book->heldReservations()->exists()) {
                    $message .= ' Les exemplaires présents sont mis de côté pour des adhérents qui les ont réservés.';
                }
                throw new BusinessRuleException($message);
            }

            // RÈGLE 1 : un emprunt dure 3 semaines (jusqu'à la fin de la journée)
            $loan = Loan::create([
                'user_id' => $user->id,
                'book_id' => $book->id,
                'borrowed_at' => now(),
                'due_at' => now()->addDays(Loan::DURATION_DAYS)->endOfDay(),
            ]);

            // Sa réservation (mise de côté ou encore en attente) est maintenant honorée
            $book->reservations()
                ->where('user_id', $user->id)
                ->open()
                ->update(['status' => Reservation::STATUS_HONOREE]);

            return $loan;
        });
    }

    /**
     * Enregistre un retour.
     *
     * @return array{loan: Loan, held_for: ?Reservation}
     *         held_for = la réservation pour laquelle le livre doit être mis de côté (règle 6)
     */
    public function returnLoan(Loan $loan): array
    {
        if (! $loan->isActive()) {
            throw new BusinessRuleException('Ce livre a déjà été rendu.');
        }

        return DB::transaction(function () use ($loan) {
            $loan->update(['returned_at' => now()]);

            // RÈGLE 6 : le livre revient → mis de côté pour le premier de la file
            $heldFor = $this->reservations->assignAvailableCopies($loan->book)->first();

            return ['loan' => $loan, 'held_for' => $heldFor];
        });
    }
}
