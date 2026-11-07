<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /** Mot de passe haché une seule fois puis réutilisé (le hachage est lent). */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->numerify('06 ## ## ## ##'),
            'role' => User::ROLE_ADHERENT,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /** Usage : User::factory()->bibliothecaire()->create() */
    public function bibliothecaire(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_BIBLIOTHECAIRE,
        ]);
    }
}
