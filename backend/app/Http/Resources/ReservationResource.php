<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Format JSON d'une réservation. */
class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status, // en_attente | disponible | honoree | annulee | expiree
            'created_at' => $this->created_at?->toIso8601String(),
            'available_at' => $this->available_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(), // date limite pour venir chercher le livre
            'position' => $this->when(isset($this->position), fn () => $this->position), // place dans la file (étape 8)

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
