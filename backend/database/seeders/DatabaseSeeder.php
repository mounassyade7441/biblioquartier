<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Lancé par : php artisan db:seed  (ou migrate:fresh --seed) */
    public function run(): void
    {
        // L'ordre compte : les livres et les adhérents doivent exister avant les emprunts.
        $this->call([
            CatalogueSeeder::class,
            UserSeeder::class,
            ActivitySeeder::class,
        ]);
    }
}
