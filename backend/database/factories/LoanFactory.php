<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Loan>
 */
class LoanFactory extends Factory
{
    /** Par défaut : un emprunt EN COURS, pas encore en retard. */
    public function definition(): array
    {
        return $this->datesFrom(fake()->numberBetween(0, Loan::DURATION_DAYS - 1)) + [
            'user_id' => User::factory(),
            'book_id' => Book::factory(),
            'returned_at' => null,
            'extended' => false,
        ];
    }

    /** Emprunt en cours dont la date de retour est dépassée. */
    public function overdue(): static
    {
        return $this->state(fn () => $this->datesFrom(
            fake()->numberBetween(Loan::DURATION_DAYS + 1, 40)
        ));
    }

    /** Emprunt terminé (pour l'historique). */
    public function returned(): static
    {
        return $this->state(function () {
            $dates = $this->datesFrom(fake()->numberBetween(25, 365));
            $dates['returned_at'] = $dates['borrowed_at']->copy()
                ->addDays(fake()->numberBetween(3, Loan::DURATION_DAYS));

            return $dates;
        });
    }

    /** Calcule borrowed_at et due_at (règle 1 : + 21 jours) à partir d'un "il y a X jours". */
    private function datesFrom(int $daysAgo): array
    {
        $borrowedAt = Carbon::now()->subDays($daysAgo);

        return [
            'borrowed_at' => $borrowedAt,
            'due_at' => $borrowedAt->copy()->addDays(Loan::DURATION_DAYS),
        ];
    }
}
