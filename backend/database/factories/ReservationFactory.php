<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    /** Par défaut : une réservation en file d'attente. */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'book_id' => Book::factory(),
            'status' => Reservation::STATUS_EN_ATTENTE,
            'available_at' => null,
            'expires_at' => null,
        ];
    }

    /** Livre revenu et mis de côté : 3 jours pour venir le chercher. */
    public function disponible(): static
    {
        return $this->state(fn () => [
            'status' => Reservation::STATUS_DISPONIBLE,
            'available_at' => now(),
            'expires_at' => now()->addDays(Reservation::HOLD_DAYS),
        ]);
    }
}
