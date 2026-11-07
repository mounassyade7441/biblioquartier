<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Catégories côté public (pour le filtre du catalogue). */
class CategoryController extends Controller
{
    /** GET /api/categories */
    public function index(): AnonymousResourceCollection
    {
        // withCount('books') ignore automatiquement les livres retirés (soft delete)
        $categories = Category::withCount('books')->orderBy('name')->get();

        return CategoryResource::collection($categories);
    }
}
