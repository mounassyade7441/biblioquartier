<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/my/summary — l'essentiel en un appel, pour l'en-tête de l'espace adhérent :
 * bandeau rouge si retard, compteur "2 / 3 emprunts", "1 livre vous attend"…
 */
class SummaryController extends Controller
{
    public function __invoke(Request $request, ReservationService $reservations): JsonResponse
    {
        $reservations->expireOverdueHolds();
        $user = $request->user();

        $active = $user->activeLoans()->count();
        $overdue = $user->loans()->overdue()->count();

        return response()->json(['data' => [
            'active_loans_count' => $active,
            'max_loans' => Loan::MAX_ACTIVE,
            'overdue_count' => $overdue,
            'can_borrow' => $overdue === 0 && $active < Loan::MAX_ACTIVE, // règles 2 et 3
            'can_reserve' => $overdue === 0,                               // règle 3
            'waiting_reservations_count' => $user->reservations()->where('status', Reservation::STATUS_EN_ATTENTE)->count(),
            'ready_reservations_count' => $user->reservations()->where('status', Reservation::STATUS_DISPONIBLE)->count(),
        ]]);
    }
}
