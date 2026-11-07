<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Authentification par jeton (Laravel Sanctum).
 *
 * 1. Le front envoie email + mot de passe à /api/auth/login
 * 2. L'API renvoie un jeton (token)
 * 3. Le front renvoie ce jeton dans l'en-tête "Authorization: Bearer <token>" à chaque requête
 * 4. Le middleware auth:sanctum retrouve l'utilisateur grâce au jeton
 */
class AuthController extends Controller
{
    /** POST /api/auth/register — un visiteur crée son compte adhérent. */
    public function register(RegisterRequest $request): JsonResponse
    {
        // "role" n'est pas dans Fillable : même si le visiteur envoie role=bibliothecaire,
        // il est ignoré et la base applique la valeur par défaut "adherent".
        $user = User::create($request->validated());
        $user->refresh(); // relit la ligne en base pour récupérer le rôle par défaut

        return response()->json([
            'message' => 'Bienvenue ! Votre compte adhérent a été créé.',
            'token' => $user->createToken('biblioquartier')->plainTextToken,
            'user' => new UserResource($user),
        ], 201);
    }

    /** POST /api/auth/login */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->input('email'))->first();

        // Message volontairement identique dans les deux cas :
        // on ne révèle pas si l'adresse e-mail existe dans la base.
        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Adresse e-mail ou mot de passe incorrect.',
            ]);
        }

        return response()->json([
            'message' => "Bonjour {$user->name} !",
            'token' => $user->createToken('biblioquartier')->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }

    /** GET /api/auth/me — qui suis-je ? (utilisé par React au rechargement de la page) */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /** POST /api/auth/logout — supprime le jeton utilisé pour cette requête. */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Vous êtes déconnecté. À bientôt !']);
    }
}
