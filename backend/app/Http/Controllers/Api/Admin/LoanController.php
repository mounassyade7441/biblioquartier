<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreLoanRequest;
use App\Http\Resources\LoanResource;
use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use App\Services\LoanService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Prêts et retours, côté bibliothécaire.
 * Le contrôleur reste "mince" : il reçoit la requête, appelle le LoanService
 * (qui contient les règles), puis formate la réponse.
 */
class LoanController extends Controller
{
    public function __construct(private LoanService $loans)
    {
    }

    /**
     * GET /api/admin/loans?status=active|overdue|returned|all&search=...
     * Par défaut : les prêts en cours, les plus urgents en premier.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:active,overdue,returned,all'],
            'search' => ['nullable', 'string', 'max:100'],
            'user_id' => ['nullable', 'integer'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $status = $validated['status'] ?? 'active';
        $search = trim($validated['search'] ?? '');

        $query = Loan::with(['user', 'book'])
            ->when($status === 'active', fn (Builder $q) => $q->active()->orderBy('due_at'))
            ->when($status === 'overdue', fn (Builder $q) => $q->overdue()->orderBy('due_at'))
            ->when($status === 'returned', fn (Builder $q) => $q->returned()->orderByDesc('returned_at'))
            ->when($status === 'all', fn (Builder $q) => $q->orderByDesc('borrowed_at'))
            ->when($validated['user_id'] ?? null, fn (Builder $q, $id) => $q->where('user_id', $id))
            // Recherche par nom/e-mail de l'adhérent OU titre du livre
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $q) use ($search) {
                $q->whereHas('user', fn (Builder $u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                  ->orWhereHas('book', fn (Builder $b) => $b->withTrashed()->where('title', 'like', "%{$search}%"));
            }));

        return LoanResource::collection($query->paginate($validated['per_page'] ?? 15)->withQueryString());
    }

    /** POST /api/admin/loans — un adhérent repart avec un livre */
    public function store(StoreLoanRequest $request): JsonResponse
    {
        $user = User::findOrFail($request->integer('user_id'));
        $book = Book::findOrFail($request->integer('book_id'));

        $loan = $this->loans->checkout($user, $book); // ← les règles 1, 2, 3, 6 sont vérifiées ici

        return (new LoanResource($loan->load(['user', 'book'])))
            ->additional([
                'message' => "Prêt enregistré : « {$book->title} » pour {$user->name}, à rendre au plus tard le "
                    .$loan->due_at->format('d/m/Y').'.',
            ])
            ->response()
            ->setStatusCode(201);
    }

    /** POST /api/admin/loans/{loan}/return — l'adhérent rapporte le livre */
    public function markReturned(Loan $loan): JsonResponse
    {
        ['loan' => $loan, 'held_for' => $heldFor] = $this->loans->returnLoan($loan);

        $message = "Retour enregistré : « {$loan->book->title} ».";

        // Règle 6 : prévenir le bibliothécaire qu'il doit mettre le livre de côté
        if ($heldFor) {
            $heldFor->load('user');
            $message .= " Ce livre est réservé : mettez-le de côté pour {$heldFor->user->name} "
                .'jusqu\'au '.$heldFor->expires_at->format('d/m/Y').'.';
        }

        return (new LoanResource($loan->load(['user', 'book'])))
            ->additional([
                'message' => $message,
                'held_for' => $heldFor ? ['name' => $heldFor->user->name, 'expires_at' => $heldFor->expires_at->toIso8601String()] : null,
            ])
            ->response();
    }
}
