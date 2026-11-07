<?php

use App\Exceptions\BusinessRuleException;
use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Raccourci utilisable dans les routes : ->middleware('role:bibliothecaire')
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Les routes /api/* répondent toujours en JSON (jamais en page HTML).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Une règle métier refusée n'est pas un bug : inutile de l'écrire dans les logs.
        $exceptions->dontReport([BusinessRuleException::class]);

        // Messages d'erreur en français, compréhensibles par l'utilisateur final.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Vous devez être connecté pour accéder à cette page.'], 401);
            }
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => "Vous n'avez pas les droits nécessaires pour effectuer cette action."], 403);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Ressource introuvable.'], 404);
            }
        });

        $exceptions->render(function (TooManyRequestsHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Trop de tentatives. Merci de patienter une minute avant de réessayer.'], 429);
            }
        });
    })->create();
