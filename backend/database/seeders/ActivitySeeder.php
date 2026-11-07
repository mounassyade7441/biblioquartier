<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Loan;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    public function run(): void
    {
        $this->demoScenarios();   // d'abord les situations précises…
        $this->randomActivity();  // …puis l'activité aléatoire, sur les exemplaires restants
    }

    /** Une situation par règle, pour pouvoir tout tester avec les comptes de démo. */
    private function demoScenarios(): void
    {
        $alice = $this->user('alice@exemple.fr');
        $bruno = $this->user('bruno@exemple.fr');
        $chloe = $this->user('chloe@exemple.fr');
        $david = $this->user('david@exemple.fr');
        $emma = $this->user('emma@exemple.fr');
        $hugo = $this->user('hugo@exemple.fr');

        // ALICE : 2 emprunts en cours + historique.
        // "Dune" (1 seul exemplaire) est attendu par Emma puis Hugo → Alice ne pourra pas le prolonger (règle 4).
        $this->loan($alice, 'Dune', daysAgo: 10);
        $this->loan($alice, 'Le Petit Prince', daysAgo: 5);
        $this->loan($alice, 'Madame Bovary', daysAgo: 90, returnedAfter: 15);
        $this->loan($alice, 'Le Hobbit', daysAgo: 60, returnedAfter: 20);
        $this->loan($alice, 'Persepolis', daysAgo: 45, returnedAfter: 12);

        // File d'attente de "Dune" : Emma est arrivée avant Hugo (règle 5).
        $this->reservation($emma, 'Dune', Reservation::STATUS_EN_ATTENTE, daysAgo: 4);
        $this->reservation($hugo, 'Dune', Reservation::STATUS_EN_ATTENTE, daysAgo: 2);

        // BRUNO : "Persepolis" emprunté il y a 30 jours → en retard de 9 jours (règle 3 : bloqué).
        $this->loan($bruno, 'Persepolis', daysAgo: 30);
        $this->reservation($alice, 'Persepolis', Reservation::STATUS_EN_ATTENTE, daysAgo: 3);

        // CHLOÉ : 3 emprunts en cours → plafond atteint (règle 2). "1984" a déjà été prolongé (règle 4).
        $this->loan($chloe, 'Le Hobbit', daysAgo: 8);
        $this->loan($chloe, '1984', daysAgo: 20, extended: true);
        $this->loan($chloe, 'Astérix le Gaulois', daysAgo: 2);

        // DAVID : il avait réservé "L'Arabe du futur" pendant que Hugo l'avait.
        // Hugo l'a rendu hier → le livre est mis de côté pour David pendant 3 jours (règle 6).
        $this->loan($hugo, "L'Arabe du futur", daysAgo: 25, returnedAfter: 24);
        $this->reservation($david, "L'Arabe du futur", Reservation::STATUS_DISPONIBLE, daysAgo: 10, availableDaysAgo: 1);

        // Historique de réservations terminées (pour l'affichage).
        $this->loan($emma, 'Matilda', daysAgo: 45, returnedAfter: 14);
        $this->reservation($emma, 'Matilda', Reservation::STATUS_HONOREE, daysAgo: 50, availableDaysAgo: 46);
        $this->reservation($hugo, 'Germinal', Reservation::STATUS_ANNULEE, daysAgo: 20);
        $this->reservation($bruno, 'Ils étaient dix', Reservation::STATUS_EXPIREE, daysAgo: 15, availableDaysAgo: 12);
    }

    /** 20 adhérents aléatoires : historique (pour le "top des livres") et quelques emprunts en cours. */
    private function randomActivity(): void
    {
        $books = Book::all();
        $popular = $books->shuffle()->take(8); // ces livres sortiront plus souvent → un vrai "top"

        $members = User::where('role', User::ROLE_ADHERENT)
            ->where('email', 'not like', '%@exemple.fr')
            ->get();

        foreach ($members as $index => $member) {
            // Historique : 2 à 8 emprunts rendus, 60 % du temps parmi les livres populaires
            for ($n = rand(2, 8); $n > 0; $n--) {
                $book = rand(1, 100) <= 60 ? $popular->random() : $books->random();
                Loan::factory()->returned()->create(['user_id' => $member->id, 'book_id' => $book->id]);
            }

            // Emprunts en cours : 0 à 2, uniquement sur des livres qui ont un exemplaire libre.
            // Le premier adhérent aléatoire reçoit un emprunt en retard (2e retard du tableau de bord).
            $wanted = $index === 0 ? 1 : rand(0, 2);

            foreach ($books->shuffle() as $book) {
                if ($wanted === 0) {
                    break;
                }
                if ($book->availableCopies() === 0) {
                    continue;
                }

                $factory = $index === 0 ? Loan::factory()->overdue() : Loan::factory();
                $factory->create(['user_id' => $member->id, 'book_id' => $book->id]);
                $wanted--;
            }
        }
    }

    // ---------- Petites fonctions utilitaires ----------

    private function user(string $email): User
    {
        return User::where('email', $email)->firstOrFail();
    }

    private function book(string $title): Book
    {
        return Book::where('title', $title)->firstOrFail();
    }

    /** Crée un emprunt commencé il y a $daysAgo jours, éventuellement rendu $returnedAfter jours plus tard. */
    private function loan(User $user, string $title, int $daysAgo, ?int $returnedAfter = null, bool $extended = false): Loan
    {
        $borrowedAt = now()->subDays($daysAgo);
        $duration = Loan::DURATION_DAYS + ($extended ? Loan::EXTENSION_DAYS : 0);

        return Loan::create([
            'user_id' => $user->id,
            'book_id' => $this->book($title)->id,
            'borrowed_at' => $borrowedAt,
            'due_at' => $borrowedAt->copy()->addDays($duration),
            'returned_at' => $returnedAfter === null ? null : $borrowedAt->copy()->addDays($returnedAfter),
            'extended' => $extended,
        ]);
    }

    /** Crée une réservation faite il y a $daysAgo jours (created_at = place dans la file). */
    private function reservation(User $user, string $title, string $status, int $daysAgo, ?int $availableDaysAgo = null): Reservation
    {
        $availableAt = $availableDaysAgo === null ? null : now()->subDays($availableDaysAgo);

        // forceCreate : permet de fixer created_at nous-mêmes (sinon Laravel mettrait "maintenant")
        return Reservation::forceCreate([
            'user_id' => $user->id,
            'book_id' => $this->book($title)->id,
            'status' => $status,
            'available_at' => $availableAt,
            'expires_at' => $availableAt?->copy()->addDays(Reservation::HOLD_DAYS),
            'created_at' => now()->subDays($daysAgo),
        ]);
    }
}
