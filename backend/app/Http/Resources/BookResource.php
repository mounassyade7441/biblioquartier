<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * Format JSON d'un livre. La disponibilité est CALCULÉE ici (jamais stockée),
 * pour être toujours à jour.
 */
class BookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $available = $this->availableCopies();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'author' => $this->author,
            'isbn' => $this->isbn,
            'summary' => $this->summary,
            'cover_url' => $this->cover_url,
            'published_year' => $this->published_year,
            'category' => new CategoryResource($this->whenLoaded('category')),

            // Disponibilité
            'total_copies' => $this->total_copies,
            'available_copies' => $available,
            'is_available' => $available > 0,
            'waiting_count' => $this->when(isset($this->waiting_count), fn () => (int) $this->waiting_count),

            // Fiche détaillée uniquement : date de retour la plus proche si tout est emprunté
            'next_return_at' => $this->when(
                $available === 0 && isset($this->active_loans_min_due_at),
                fn () => Carbon::parse($this->active_loans_min_due_at)->toIso8601String()
            ),
            // true si cette date est déjà dépassée (l'emprunteur est en retard)
            'next_return_overdue' => $this->when(
                $available === 0 && isset($this->active_loans_min_due_at),
                fn () => Carbon::parse($this->active_loans_min_due_at)->isPast()
            ),
        ];
    }
}
