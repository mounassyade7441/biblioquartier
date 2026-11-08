# BiblioQuartier — API (Laravel)

API REST de l'application BiblioQuartier. **Le guide complet (installation, comptes de démo, règles) est dans le [README principal](../README.md).**

## Démarrage rapide

```bash
composer install
cp .env.example .env          # Windows (cmd) : copy .env.example .env
php artisan key:generate
php artisan migrate --seed    # la base MySQL "biblioquartier" doit exister
php artisan serve             # → http://127.0.0.1:8000
```

## Où trouver quoi

| Dossier / fichier | Contenu |
|---|---|
| `routes/api.php` | Toutes les routes, classées par niveau d'accès (public / connecté / adhérent / bibliothécaire) |
| `app/Services/LoanService.php` | Règles des emprunts : durée (1), maximum (2), retard (3), prolongation (4) |
| `app/Services/ReservationService.php` | Règles des réservations : réserver (3, 5), file d'attente et mise de côté (6) |
| `app/Http/Controllers/Api/` | Contrôleurs : public, `Member/` (adhérent), `Admin/` (bibliothécaire) |
| `app/Http/Requests/` | Validation des formulaires |
| `app/Http/Resources/` | Format JSON renvoyé au front |
| `app/Http/Middleware/EnsureUserHasRole.php` | Contrôle du rôle (`role:bibliothecaire`) |
| `app/Exceptions/BusinessRuleException.php` | Règle non respectée → réponse 422 avec un message clair |
| `database/migrations/`, `database/seeders/` | Structure de la base et données de démonstration |
| `routes/console.php` | Tâche planifiée `reservations:expire` (règle 6) |
| `tests/Feature/` | Tests automatiques (`php artisan test`) |
