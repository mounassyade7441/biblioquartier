<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Vérifie que l'utilisateur connecté possède l'un des rôles demandés.
 *
 * Usage dans les routes :  ->middleware('role:bibliothecaire')
 *                          ->middleware('role:adherent,bibliothecaire')
 *
 * Ce middleware se place APRÈS 'auth:sanctum' : on sait déjà QUI est connecté,
 * on vérifie ici CE QU'IL A LE DROIT de faire.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => "Vous n'avez pas les droits nécessaires pour accéder à cette ressource.",
            ], Response::HTTP_FORBIDDEN); // 403
        }

        return $next($request);
    }
}
