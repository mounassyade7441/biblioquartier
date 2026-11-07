<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['title', 'author', 'isbn', 'summary', 'cover_url', 'published_year', 'total_copies', 'category_id'])]
class Book extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'total_copies' => 'integer',
            'published_year' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /** Exemplaires actuellement sortis. */
    public function activeLoans(): HasMany
    {
        return $this->loans()->whereNull('returned_at');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /** File d'attente, du plus ancien au plus récent (règle 5 : ordre d'arrivée). */
    public function waitingReservations(): HasMany
    {
        return $this->reservations()
            ->where('status', Reservation::STATUS_EN_ATTENTE)
            ->orderBy('created_at')
            ->orderBy('id');
    }

    /** Exemplaires mis de côté pour un adhérent (règle 6). */
    public function heldReservations(): HasMany
    {
        return $this->reservations()->where('status', Reservation::STATUS_DISPONIBLE);
    }

    /**
     * Nombre d'exemplaires empruntables tout de suite :
     * total − exemplaires empruntés − exemplaires mis de côté.
     *
     * Si les compteurs ont déjà été chargés avec withCount() (utile pour la liste
     * du catalogue), on les réutilise au lieu de refaire 2 requêtes par livre.
     */
    public function availableCopies(): int
    {
        $active = $this->active_loans_count ?? $this->activeLoans()->count();
        $held = $this->held_reservations_count ?? $this->heldReservations()->count();

        return max(0, $this->total_copies - $active - $held);
    }
}

