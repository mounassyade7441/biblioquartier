<?php

use App\Http\Controllers\Api\Admin\BookController as AdminBookController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\LoanController as AdminLoanController;
use App\Http\Controllers\Api\Admin\MemberController as AdminMemberController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\CategoryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes de l'API BiblioQuartier
|--------------------------------------------------------------------------
| Toutes ces routes sont automatiquement préfixées par /api
| (ex. : Route::post('/auth/login') → POST http://127.0.0.1:8000/api/auth/login)
|
| Trois niveaux d'accès :
|   1. Public            → visiteur, sans jeton
|   2. auth:sanctum      → il faut être connecté (jeton valide)
|   3. role:xxx          → il faut en plus avoir le bon rôle
*/

// ---------- 1. PUBLIC (visiteur) ----------
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    // throttle:5,1 → 5 tentatives par minute maximum (protection contre les attaques par force brute)
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{book}', [BookController::class, 'show'])->whereNumber('book');

// ---------- 2. CONNECTÉ (adhérent ou bibliothécaire) ----------
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ---------- 3a. ADHÉRENT uniquement ----------
    Route::middleware('role:adherent')->group(function () {
        // (étapes 8-9 : mes emprunts, prolonger, réserver, annuler, historique)
    });

    // ---------- 3b. BIBLIOTHÉCAIRE uniquement ----------
    Route::middleware('role:bibliothecaire')->prefix('admin')->group(function () {
        // Catalogue (étape 6) — la consultation passe par les routes publiques /api/books
        Route::post('/books', [AdminBookController::class, 'store']);
        Route::put('/books/{book}', [AdminBookController::class, 'update'])->whereNumber('book');
        Route::delete('/books/{book}', [AdminBookController::class, 'destroy'])->whereNumber('book');

        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update'])->whereNumber('category');
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])->whereNumber('category');

        // Adhérents, prêts et retours (étape 7)
        Route::get('/members', [AdminMemberController::class, 'index']);
        Route::get('/loans', [AdminLoanController::class, 'index']);
        Route::post('/loans', [AdminLoanController::class, 'store']);
        Route::post('/loans/{loan}/return', [AdminLoanController::class, 'markReturned'])->whereNumber('loan');

        // (étape 9 : tableau de bord)
    });
});
