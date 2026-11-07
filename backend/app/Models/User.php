<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// "role" n'est volontairement PAS dans Fillable : un visiteur ne doit jamais
// pouvoir se déclarer bibliothécaire en envoyant role=bibliothecaire à l'inscription.
#[Fillable(['name', 'email', 'password', 'phone'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADHERENT = 'adherent';
    public const ROLE_BIBLIOTHECAIRE = 'bibliothecaire';

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isBibliothecaire(): bool
    {
        return $this->role === self::ROLE_BIBLIOTHECAIRE;
    }

    public function isAdherent(): bool
    {
        return $this->role === self::ROLE_ADHERENT;
    }

    /** Tous les emprunts (en cours + historique). */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /** Emprunts pas encore rendus. */
    public function activeLoans(): HasMany
    {
        return $this->loans()->whereNull('returned_at');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /** Règle 3 : a-t-il au moins un livre en retard ? */
    public function hasOverdueLoans(): bool
    {
        return $this->loans()->overdue()->exists();
    }
}
