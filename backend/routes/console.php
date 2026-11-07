<?php

use App\Services\ReservationService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
| RÈGLE 6 — "Passé ce délai [3 jours], la réservation est annulée."
|
| Commande manuelle :   php artisan reservations:expire
| Automatique :         toutes les heures grâce au planificateur de Laravel.
|   - en développement : laisser tourner  php artisan schedule:work
|   - en production    : une tâche cron qui lance  php artisan schedule:run  chaque minute
|
| (Par sécurité, l'expiration est AUSSI vérifiée avant chaque prêt et chaque réservation.)
*/
Artisan::command('reservations:expire', function (ReservationService $reservations) {
    $count = $reservations->expireOverdueHolds();
    $this->info("{$count} réservation(s) expirée(s) — les exemplaires ont été proposés au suivant de la file.");
})->purpose('Annule les réservations non retirées après 3 jours (règle 6)');

Schedule::command('reservations:expire')->hourly();
