<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Liste des adhérents, pour que le bibliothécaire choisisse à qui prêter un livre. */
class MemberController extends Controller
{
    /** GET /api/admin/members?search=alice */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $search = trim($validated['search'] ?? '');

        $members = User::where('role', User::ROLE_ADHERENT)
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
            }))
            ->withCount('activeLoans')
            ->withExists(['loans as has_overdue_loans' => fn (Builder $q) => $q->overdue()])
            ->orderBy('name')
            ->paginate($validated['per_page'] ?? 20)
            ->withQueryString();

        return MemberResource::collection($members);
    }
}
