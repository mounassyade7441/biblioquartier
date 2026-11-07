<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Validation du formulaire d'inscription.
 * Si une règle échoue, Laravel renvoie automatiquement une réponse 422
 * avec la liste des erreurs, champ par champ.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // tout visiteur peut s'inscrire
    }

    /** Nettoie les données AVANT la validation. */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            // "confirmed" exige un champ password_confirmation identique
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ];
    }
}
