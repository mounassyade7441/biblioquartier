<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Exception levée quand une RÈGLE DE FONCTIONNEMENT de la bibliothèque est violée
 * (ex. : "On ne peut pas retirer un livre en cours d'emprunt").
 *
 * Laravel appelle automatiquement render() : l'API renvoie alors une réponse 422
 * avec un message clair, que React affiche tel quel à l'utilisateur.
 *
 * Usage : throw new BusinessRuleException("Message pour l'utilisateur.");
 */
class BusinessRuleException extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 422);
    }
}
