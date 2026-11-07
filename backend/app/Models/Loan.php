<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'book_id', 'borrowed_at', 'due_at', 'returned_at', 'extended'])]
class Loan extends Model
{
    use HasFactory;

    // Les règles du client, regroupées à un seul endroit.
    public const DURATION_DAYS = 21;   // règle 1 : 3 semaines
    public const MAX_ACTIVE = 3;       // règle 2 : 3 livres maximum
    public const EXTENSION_DAYS = 7;   // règle 4 : prolongation d'une semaine

    protected function casts(): array
    {
        return [
            'borrowed_at' => 'datetime',
            'due_at' => 'datetime',
            'returned_at' => 'datetime',
            'extended' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** withTrashed : on affiche le livre dans l'historique même s'il a été retiré. */
    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class)->withTrashed();
    }

    // ----- Scopes : des filtres réutilisables, ex. Loan::active()->get() -----

    public function scopeActive(Builder $query): void
    {
        $query->whereNull('returned_at');
    }

    public function scopeOverdue(Builder $query): void
    {
        $query->whereNull('returned_at')->where('due_at', '<', now());
    }

    public function scopeReturned(Builder $query): void
    {
        $query->whereNotNull('returned_at');
    }

    // ----- Helpers sur un emprunt précis -----

    public function isActive(): bool
    {
        return $this->returned_at === null;
    }

    public function isOverdue(): bool
    {
        return $this->isActive() && $this->due_at->isPast();
    }
}

