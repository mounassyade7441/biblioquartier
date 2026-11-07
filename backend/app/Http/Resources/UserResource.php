<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Format JSON d'un utilisateur renvoyé au front.
 * On choisit explicitement les champs : le mot de passe ou le remember_token
 * ne peuvent donc jamais fuiter, même par erreur.
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
