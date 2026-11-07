<?php

namespace App\Http\Requests\Admin;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validation du formulaire "livre" (ajout ET modification).
 * L'accès est déjà limité aux bibliothécaires par le middleware role:bibliothecaire.
 */
class BookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'author' => ['required', 'string', 'max:255'],
            'isbn' => ['nullable', 'string', 'max:20'],
            'summary' => ['nullable', 'string', 'max:5000'],
            'cover_url' => ['nullable', 'url', 'max:2048'],
            'published_year' => ['nullable', 'integer', 'between:1000,'.(now()->year + 1)],
            'total_copies' => ['required', 'integer', 'min:1', 'max:999'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
        ];
    }

    /**
     * Vérification supplémentaire lors d'une MODIFICATION :
     * on ne peut pas descendre sous le nombre d'exemplaires actuellement
     * empruntés ou mis de côté (sinon la disponibilité deviendrait négative).
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                $book = $this->route('book');

                if (! $book instanceof Book || $validator->errors()->has('total_copies')) {
                    return; // création, ou champ déjà invalide
                }

                $inUse = $book->activeLoans()->count() + $book->heldReservations()->count();

                if ((int) $this->input('total_copies') < $inUse) {
                    $validator->errors()->add(
                        'total_copies',
                        "Impossible : {$inUse} exemplaire(s) sont actuellement empruntés ou mis de côté."
                    );
                }
            },
        ];
    }
}
