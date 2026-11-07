<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['name' => trim((string) $this->input('name'))]);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:100',
                // Unique, sauf pour la catégorie en cours de modification
                Rule::unique('categories', 'name')->ignore($this->route('category')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Cette catégorie existe déjà.',
        ];
    }
}
