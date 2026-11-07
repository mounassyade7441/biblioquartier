<?php

/*
| Messages de validation en français.
| Laravel les utilise car APP_LOCALE=fr dans le .env.
| Une règle absente de ce fichier retombe sur le message anglais par défaut.
*/

return [
    'accepted' => 'Le champ :attribute doit être accepté.',
    'after_or_equal' => 'Le champ :attribute doit être une date postérieure ou égale au :date.',
    'array' => 'Le champ :attribute doit être une liste.',
    'between' => [
        'numeric' => 'Le champ :attribute doit être compris entre :min et :max.',
        'string' => 'Le champ :attribute doit contenir entre :min et :max caractères.',
    ],
    'boolean' => 'Le champ :attribute doit être vrai ou faux.',
    'confirmed' => 'La confirmation du champ :attribute ne correspond pas.',
    'date' => "Le champ :attribute n'est pas une date valide.",
    'email' => 'Le champ :attribute doit être une adresse e-mail valide.',
    'exists' => "La valeur sélectionnée pour :attribute n'existe pas.",
    'in' => "La valeur sélectionnée pour :attribute n'est pas valide.",
    'integer' => 'Le champ :attribute doit être un nombre entier.',
    'max' => [
        'numeric' => 'Le champ :attribute ne peut pas dépasser :max.',
        'string' => 'Le champ :attribute ne peut pas dépasser :max caractères.',
        'file' => 'Le fichier :attribute ne peut pas dépasser :max Ko.',
    ],
    'min' => [
        'numeric' => 'Le champ :attribute doit être au moins égal à :min.',
        'string' => 'Le champ :attribute doit contenir au moins :min caractères.',
    ],
    'numeric' => 'Le champ :attribute doit être un nombre.',
    'required' => 'Le champ :attribute est obligatoire.',
    'string' => 'Le champ :attribute doit être une chaîne de caractères.',
    'unique' => 'Cette valeur du champ :attribute est déjà utilisée.',
    'url' => 'Le champ :attribute doit être une adresse web valide (https://…).',

    // Messages sur mesure pour un champ + une règle précis
    'custom' => [
        'email' => [
            'unique' => 'Un compte existe déjà avec cette adresse e-mail.',
        ],
    ],

    // Noms "lisibles" des champs, utilisés à la place de :attribute
    'attributes' => [
        'name' => 'nom',
        'email' => 'adresse e-mail',
        'phone' => 'téléphone',
        'password' => 'mot de passe',
        'title' => 'titre',
        'author' => 'auteur',
        'isbn' => 'ISBN',
        'summary' => 'résumé',
        'cover_url' => 'image de couverture',
        'published_year' => 'année de publication',
        'total_copies' => "nombre d'exemplaires",
        'category_id' => 'catégorie',
        'user_id' => 'adhérent',
        'book_id' => 'livre',
    ],
];
