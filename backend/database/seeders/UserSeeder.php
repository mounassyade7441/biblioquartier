<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Bibliothécaire (impossible à créer via l'inscription publique)
        User::factory()->bibliothecaire()->create([
            'name' => 'Camille Roux',
            'email' => 'biblio@biblioquartier.fr',
        ]);

        // Adhérents de démonstration (mot de passe : "password")
        $demo = [
            ['Alice Martin', 'alice@exemple.fr'],
            ['Bruno Durand', 'bruno@exemple.fr'],
            ['Chloé Petit', 'chloe@exemple.fr'],
            ['David Bernard', 'david@exemple.fr'],
            ['Emma Leroy', 'emma@exemple.fr'],
            ['Hugo Moreau', 'hugo@exemple.fr'],
        ];

        foreach ($demo as [$name, $email]) {
            User::factory()->create(['name' => $name, 'email' => $email]);
        }

        // 20 adhérents aléatoires pour remplir les statistiques
        User::factory()->count(20)->create();
    }
}
