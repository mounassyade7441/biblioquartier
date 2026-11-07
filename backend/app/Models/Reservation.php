<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'book_id', 'status', 'available_at', 'expires_at'])]
class Reservation extends Model
{
    use HasFactory;

    public const STATUS_EN_ATTENTE = 'en_attente';
    public const STATUS_DISPONIBLE = 'disponible';
    public const STATUS_HONOREE = 'honoree';
    public const STATUS_ANNULEE = 'annulee';
    public const STATUS_EXPIREE = 'expiree';

    public const HOLD_DAYS = 3; // règle 6 : 3 jours pour venir chercher le livre

    protected function casts(): array
    {
        return [
            'available_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class)->withTrashed();
    }

    /** Réservations "vivantes" : en file d'attente ou livre mis de côté. */
    public function scopeOpen(Builder $query): void
    {
        $query->whereIn('status', [self::STATUS_EN_ATTENTE, self::STATUS_DISPONIBLE]);
    }
}

