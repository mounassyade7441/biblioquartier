<?php

namespace App\Http\Resources;

use App\Services\LoanService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Format JSON d'un emprunt (utilisé côté bibliothécaire ET côté adhérent). */
class LoanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $overdue = $this->isOverdue();
        $today = now()->startOfDay();
        $dueDay = $this->due_at->copy()->startOfDay();

        return [
            'id' => $this->id,
            'borrowed_at' => $this->borrowed_at->toIso8601String(),
            'due_at' => $this->due_at->toIso8601String(),
            'returned_at' => $this->returned_at?->toIso8601String(),
            'extended' => $this->extended,

            // Statut calculé : en_cours | en_retard | rendu
            'status' => match (true) {
                ! $this->isActive() => 'rendu',
                $overdue => 'en_retard',
                default => 'en_cours',
            },
            'is_overdue' => $overdue,
            // Nombre de jours (calendaires) avant la date limite, ou de retard
            'days_left' => $this->isActive() && ! $overdue ? (int) $today->diffInDays($dueDay) : null,
            'days_overdue' => $overdue ? max(1, (int) $dueDay->diffInDays($today)) : 0,

            // Espace adhérent uniquement (routes "my.*") : peut-il prolonger ? sinon pourquoi ? (règle 4)
            $this->mergeWhen($request->routeIs('my.*') && $this->isActive(), function () {
                $reason = app(LoanService::class)->extensionBlockedReason($this->resource);

                return ['can_extend' => $reason === null, 'extend_blocked_reason' => $reason];
            }),

            'book' => $this->whenLoaded('book', fn () => [
                'id' => $this->book->id,
                'title' => $this->book->title,
                'author' => $this->book->author,
                'cover_url' => $this->book->cover_url,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
        ];
    }
}
