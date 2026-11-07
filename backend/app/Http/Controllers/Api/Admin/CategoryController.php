<?php

namespace App\Http\Controllers\Api\Admin;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/** Gestion des catégories par le bibliothécaire. */
class CategoryController extends Controller
{
    /** POST /api/admin/categories */
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'name' => $request->input('name'),
            'slug' => $this->uniqueSlug($request->input('name')),
        ]);

        return (new CategoryResource($category->loadCount('books')))
            ->additional(['message' => 'La catégorie a été créée.'])
            ->response()
            ->setStatusCode(201);
    }

    /** PUT /api/admin/categories/{category} */
    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update([
            'name' => $request->input('name'),
            'slug' => $this->uniqueSlug($request->input('name'), $category->id),
        ]);

        return (new CategoryResource($category->loadCount('books')))
            ->additional(['message' => 'La catégorie a été modifiée.'])
            ->response();
    }

    /** DELETE /api/admin/categories/{category} — seulement si elle ne contient plus aucun livre. */
    public function destroy(Category $category): JsonResponse
    {
        $count = $category->books()->count(); // ne compte pas les livres retirés (soft delete)

        if ($count > 0) {
            throw new BusinessRuleException(
                "Impossible de supprimer la catégorie « {$category->name} » : elle contient encore {$count} livre(s). "
                .'Changez-les de catégorie avant de la supprimer.'
            );
        }

        $category->delete();

        return response()->json(['message' => "La catégorie « {$category->name} » a été supprimée."]);
    }

    /** "Science-fiction" → "science-fiction" (avec -2, -3… si déjà pris). */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'categorie';
        $slug = $base;
        $i = 2;

        while (Category::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
