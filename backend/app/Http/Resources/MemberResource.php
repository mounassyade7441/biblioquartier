<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Un adhérent vu par le bibliothécaire (pour choisir à qui prêter un livre). */
class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'active_loans_count' => (int) ($this->active_loans_count ?? 0),
            'has_overdue_loans' => (bool) ($this->has_overdue_loans ?? false),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
