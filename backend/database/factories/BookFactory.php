<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => rtrim(fake()->sentence(3), '.'),
            'author' => fake()->name(),
            'isbn' => fake()->isbn13(),
            'summary' => fake()->paragraph(),
            'cover_url' => null,
            'published_year' => fake()->numberBetween(1900, 2025),
            'total_copies' => fake()->numberBetween(1, 3),
            'category_id' => Category::factory(), // crée une catégorie si on n'en fournit pas
        ];
    }
}
