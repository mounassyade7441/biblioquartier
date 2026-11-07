<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Http\Resources\LoanResource;
use App\Models\Loan;
use App\Services\LoanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Les emprunts de l'adhérent CONNECTÉ.
 * Sécurité : on part toujours de $request->user()->loans() → impossible de voir
 * ou de modifier les emprunts de quelqu'un d'autre.
 */
class LoanController extends Controller
{
    public function __construct(private LoanService $loans)
    {
    }

    /**
     * GET /api/my/loans                → emprunts en cours (les plus urgents d'abord)
     * GET /api/my/loans?status=history → anciens emprunts, paginés
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['status' => ['nullable', 'in:active,history']]);

        $query = $request->user()->loans()->with('book');

        if ($request->input('status') === 'history') {
            return LoanResource::collection(
                $query->returned()->orderByDesc('returned_at')->paginate(10)->withQueryString()
            );
        }

        // Au maximum 3 emprunts en cours : pas besoin de pagination
        return LoanResource::collection($query->active()->orderBy('due_at')->get());
    }

    /** POST /api/my/loans/{loan}/extend — RÈGLE 4 */
    public function extend(Request $request, Loan $loan): JsonResponse
    {
        // 404 (et non 403) : on ne révèle même pas que cet emprunt existe
        abort_if($loan->user_id !== $request->user()->id, 404);

        $loan = $this->loans->extend($loan);

        return (new LoanResource($loan->load('book')))
            ->additional([
                'message' => 'Emprunt prolongé d\'une semaine : à rendre au plus tard le '.$loan->due_at->format('d/m/Y').'.',
            ])
            ->response();
    }
}
