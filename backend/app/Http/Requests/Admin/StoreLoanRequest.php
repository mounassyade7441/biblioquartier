<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Formulaire "enregistrer un prêt" : quel adhérent, quel livre. */
class StoreLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required', 'integer',
                Rule::exists('users', 'id')->where('role', User::ROLE_ADHERENT),
            ],
            'book_id' => [
                'required', 'integer',
                Rule::exists('books', 'id')->whereNull('deleted_at'), // pas un livre retiré
            ],
        ];
    }
}
