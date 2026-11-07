<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\LoanResource;
use App\Http\Resources\ReservationResource;
use App\Models\Book;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;

/**
 * GET /api/admin/dashboard
 *
 * Besoin du client : "Voir en un coup d'œil les prêts en cours, les retards
 * et les livres les plus empruntés". Tout est renvoyé en UN SEUL appel.
 */
class DashboardController extends Controller
{
    public function __invoke(ReservationService $reservations): JsonResponse
    {
        $reservations->expireOverdueHolds(); // règle 6 : chiffres à jour

        return response()->json(['data' => [
            'stats' => $this->stats(),

            // Les retards, du plus ancien au plus récent
            'overdue_loans' => LoanResource::collection(
                Loan::overdue()->with(['user', 'book'])->orderBy('due_at')->limit(10)->get()
            ),

            // À rendre dans les 3 prochains jours (pour anticiper)
            'due_soon' => LoanResource::collection(
                Loan::active()
                    ->whereBetween('due_at', [now(), now()->addDays(3)->endOfDay()])
                    ->with(['user', 'book'])->orderBy('due_at')->limit(10)->get()
            ),

            // Livres à mettre de côté / en attente de retrait (règle 6)
            'ready_reservations' => ReservationResource::collection(
                Reservation::where('status', Reservation::STATUS_DISPONIBLE)
                    ->with(['user', 'book'])->orderBy('expires_at')->get()
            ),

            'top_books' => $this->topBooks(),
            'monthly_loans' => $this->monthlyLoans(),
        ]]);
    }

    /** Les chiffres clés. */
    private function stats(): array
    {
        $totalCopies = (int) Book::sum('total_copies');
        $activeLoans = Loan::active()->count();

        return [
            'active_loans' => $activeLoans,
            'overdue_loans' => Loan::overdue()->count(),
            'members_with_overdue' => Loan::overdue()->distinct()->count('user_id'),
            'books' => Book::count(),
            'total_copies' => $totalCopies,
            'copies_out' => $activeLoans,
            'members' => User::where('role', User::ROLE_ADHERENT)->count(),
            'waiting_reservations' => Reservation::where('status', Reservation::STATUS_EN_ATTENTE)->count(),
            'ready_reservations' => Reservation::where('status', Reservation::STATUS_DISPONIBLE)->count(),
            'loans_this_month' => Loan::where('borrowed_at', '>=', now()->startOfMonth())->count(),
            'returns_due_today' => Loan::active()->whereBetween('due_at', [now()->startOfDay(), now()->endOfDay()])->count(),
        ];
    }

    /** Les 5 livres les plus empruntés (tous emprunts confondus). */
    private function topBooks(): array
    {
        return Book::withCount('loans')
            ->with('category')
            ->whereHas('loans') // seulement les livres empruntés au moins une fois
            ->orderByDesc('loans_count')
            ->orderBy('title')
            ->limit(5)
            ->get()
            ->map(fn (Book $book) => [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'cover_url' => $book->cover_url,
                'category' => $book->category?->name,
                'loans_count' => (int) $book->loans_count,
            ])
            ->all();
    }

    /**
     * Nombre d'emprunts par mois sur les 6 derniers mois (pour un petit graphique).
     * Le regroupement est fait en PHP : ça marche pareil avec MySQL et SQLite (tests).
     */
    private function monthlyLoans(): array
    {
        $start = now()->startOfMonth()->subMonths(5);

        $counts = Loan::where('borrowed_at', '>=', $start)
            ->pluck('borrowed_at')
            ->countBy(fn ($date) => $date->format('Y-m'));

        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $month = $start->copy()->addMonths($i);
            $months[] = [
                'month' => $month->format('Y-m'),
                'label' => ucfirst($month->locale('fr')->translatedFormat('M Y')), // "Nov. 2026"
                'count' => $counts->get($month->format('Y-m'), 0),
            ];
        }

        return $months;
    }
}
