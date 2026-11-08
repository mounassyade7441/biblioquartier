# 📚 BiblioQuartier

Application web de gestion d'une bibliothèque associative de quartier (environ 2 000 livres, 300 adhérents).
Elle remplace le cahier papier des prêts : les **adhérents** consultent le catalogue et réservent en ligne,
les **bibliothécaires** gèrent les livres, les prêts et les retours.

| | Technologie |
|---|---|
| **Front-end** | React 19 · Vite · React Router · Axios · Tailwind CSS |
| **Back-end** | Laravel 13 (API REST) · Laravel Sanctum (authentification par jeton) |
| **Base de données** | MySQL 8 (migrations + seeder de données de test) |

---

## Sommaire

1. [Fonctionnalités](#1-fonctionnalités)
2. [Règles de fonctionnement](#2-règles-de-fonctionnement)
3. [Installation](#3-installation)
4. [Lancer le projet](#4-lancer-le-projet)
5. [Comptes de démonstration](#5-comptes-de-démonstration)
6. [Tests](#6-tests)
7. [Architecture](#7-architecture)
8. [API REST](#8-api-rest)
9. [Sécurité](#9-sécurité)
10. [Dépannage](#10-dépannage)

---

## 1. Fonctionnalités

### Visiteur (sans compte)
- Parcourir le catalogue (pagination)
- Rechercher un livre par **titre ou auteur**, filtrer par **catégorie**, n'afficher que les livres disponibles, trier
- Voir la fiche d'un livre : couverture, résumé, auteur, **disponibilité** (exemplaires libres, date de retour prévue, file d'attente)
- Créer un compte adhérent, se connecter

### Adhérent
- **Réserver** un livre dont tous les exemplaires sont empruntés, et **annuler** une réservation
- Voir ses **emprunts en cours** et la **date de retour**
- Être **averti visuellement d'un retard** (bandeau rouge, carte rouge, pastille dans le menu)
- **Prolonger** un emprunt
- Consulter l'**historique** de ses anciens emprunts

### Bibliothécaire
- **Ajouter, modifier, retirer** des livres et indiquer le **nombre d'exemplaires**
- **Gérer les catégories**
- **Enregistrer un prêt** (recherche de l'adhérent puis du livre) et **enregistrer un retour**
- **Tableau de bord** : prêts en cours, retards, livres les plus empruntés, livres à mettre de côté, emprunts par mois

L'interface est **responsive** (ordinateur et téléphone) et tous les messages d'erreur sont en français.

---

## 2. Règles de fonctionnement

Toutes les règles sont **vérifiées côté serveur** (pas seulement dans l'interface) et couvertes par des **tests automatiques**.

| # | Règle | Où dans le code |
|---|---|---|
| 1 | Un emprunt dure **3 semaines** | `LoanService::checkout()` |
| 2 | **3 livres maximum** en même temps | `LoanService::checkout()` |
| 3 | Un adhérent **en retard** ne peut plus emprunter **ni réserver** | `LoanService::checkout()`, `ReservationService::reserveBlockedReason()` |
| 4 | **Une seule prolongation** d'une semaine, sauf si l'emprunt est en retard ou si quelqu'un attend le livre | `LoanService::extensionBlockedReason()` |
| 5 | On ne réserve que si **tous les exemplaires** sont empruntés ; file servie **dans l'ordre d'arrivée** | `ReservationService::reserveBlockedReason()`, `positionOf()` |
| 6 | Au retour, le livre est **mis de côté 3 jours** pour le 1er de la file, puis la réservation expire | `ReservationService::assignAvailableCopies()`, `expireOverdueHolds()` + tâche planifiée |
| 7 | Impossible de **retirer un livre en cours d'emprunt** | `Admin\BookController::destroy()` |

Les fichiers sont dans `backend/app/Services/` et `backend/app/Http/Controllers/Api/Admin/`.

---

## 3. Installation

### Prérequis

| Outil | Version minimale | Vérifier avec |
|---|---|---|
| PHP | 8.3 (extensions `pdo_mysql`, `mbstring`, `openssl`) | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | **22.22** ou plus récent | `node -v` |
| MySQL | 8.x | `mysql --version` |
| Git | — | `git --version` |

> Sous Windows, [Laragon](https://laragon.org) fournit PHP, Composer, MySQL et Git en une seule installation.

### Étape 1 — Récupérer le projet

```bash
git clone https://github.com/mounassyade7441/biblioquartier.git
cd biblioquartier
```

### Étape 2 — Créer la base de données

```bash
mysql -u root -e "CREATE DATABASE biblioquartier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
(ou avec HeidiSQL / phpMyAdmin : une base nommée `biblioquartier`, interclassement `utf8mb4_unicode_ci`)

### Étape 3 — Installer le back-end (API Laravel)

```bash
cd backend
composer install
cp .env.example .env            # Windows (cmd) : copy .env.example .env
php artisan key:generate
```

Ouvrir `backend/.env` et vérifier la connexion MySQL (par défaut : utilisateur `root`, sans mot de passe) :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=biblioquartier
DB_USERNAME=root
DB_PASSWORD=
```

Puis créer les tables et les remplir avec les données de démonstration :

```bash
php artisan migrate --seed
```

### Étape 4 — Installer le front-end (React)

```bash
cd ../frontend
npm install
cp .env.example .env            # Windows (cmd) : copy .env.example .env
```

`frontend/.env` contient l'adresse de l'API : `VITE_API_URL=http://127.0.0.1:8000/api`.

---

## 4. Lancer le projet

Deux terminaux, à laisser ouverts :

```bash
# Terminal 1 — l'API
cd backend
php artisan serve
# → http://127.0.0.1:8000
```

```bash
# Terminal 2 — l'interface
cd frontend
npm run dev
# → http://localhost:5173
```

Ouvrir **http://localhost:5173** dans le navigateur.

**Tâche planifiée (règle 6)** — les réservations non retirées après 3 jours expirent automatiquement
toutes les heures. En développement, lancer dans un 3e terminal :

```bash
cd backend
php artisan schedule:work
```
(ou manuellement : `php artisan reservations:expire`). Par sécurité, l'expiration est aussi vérifiée avant chaque prêt et chaque réservation.

**Repartir de données propres** à tout moment : `php artisan migrate:fresh --seed`

---

## 5. Comptes de démonstration

Mot de passe pour tous : **`password`**. En développement, la page de connexion propose des boutons pour les remplir automatiquement.

| Compte | Rôle | Situation de départ — ce qu'il permet de tester |
|---|---|---|
| `biblio@biblioquartier.fr` | Bibliothécaire | Tableau de bord, prêts, retours, livres, catégories |
| `alice@exemple.fr` | Adhérente | 2 emprunts : *Le Petit Prince* prolongeable, *Dune* non (2 personnes l'attendent — règle 4) ; 1 réservation ; historique |
| `bruno@exemple.fr` | Adhérent | *Persepolis* **en retard** → alertes rouges, ne peut ni emprunter ni réserver (règle 3) |
| `chloe@exemple.fr` | Adhérente | **3 emprunts** (maximum — règle 2), dont un déjà prolongé |
| `david@exemple.fr` | Adhérent | *L'Arabe du futur* **mis de côté** pour lui pendant 3 jours (règle 6) |
| `emma@exemple.fr` | Adhérente | 1re dans la file d'attente de *Dune* (règle 5) |
| `hugo@exemple.fr` | Adhérent | 2e dans la file d'attente de *Dune* (règle 5) |

Le seeder crée aussi 8 catégories, 30 livres réels et 20 adhérents avec un historique d'emprunts (pour les statistiques).

**Scénario de démonstration conseillé :** en bibliothécaire, *Prêts & retours* → enregistrer le retour de *Dune* (Alice)
→ le message indique de le mettre de côté pour Emma → se connecter en Emma : le livre l'attend.

---

## 6. Tests

### Back-end : 80 tests automatiques (PHPUnit)

```bash
cd backend
php artisan test
```

Les tests utilisent une base **SQLite en mémoire** (voir `phpunit.xml`) : la base MySQL n'est jamais modifiée.

| Fichier | Ce qui est testé |
|---|---|
| `AuthTest` | Inscription, connexion, déconnexion, rôles, limitation des tentatives |
| `CatalogTest` | Catalogue, recherche, filtres, disponibilité |
| `AdminCatalogTest` | Gestion des livres et catégories, **règle 7** |
| `LoanTest` | Prêts et retours, **règles 1, 2, 3, 6** |
| `MemberSpaceTest` | Espace adhérent, **règles 3, 4, 5, 6**, accès limité à ses propres données |
| `DashboardTest` | Tableau de bord |

Lancer un seul fichier : `php artisan test --filter=LoanTest`

### Front-end

```bash
cd frontend
npm run lint     # vérification du code (oxlint)
npm run build    # compilation de production
```

---

## 7. Architecture

```
biblioquartier/
├── backend/                       API REST Laravel
│   ├── app/
│   │   ├── Models/                User, Book, Category, Loan, Reservation
│   │   ├── Services/              ★ LoanService, ReservationService : les règles du client
│   │   ├── Http/Controllers/Api/  Public · Member/ (adhérent) · Admin/ (bibliothécaire)
│   │   ├── Http/Requests/         Validation des formulaires
│   │   ├── Http/Resources/        Format JSON des réponses
│   │   ├── Http/Middleware/       Contrôle du rôle
│   │   └── Exceptions/            BusinessRuleException (règle non respectée → 422)
│   ├── database/migrations/       Structure de la base
│   ├── database/seeders/          Données de démonstration
│   ├── routes/api.php             Toutes les routes
│   └── tests/Feature/             Tests automatiques
└── frontend/                      Interface React
    └── src/
        ├── api/                   Appels à l'API (Axios + jeton automatique)
        ├── context/               Utilisateur connecté (AuthProvider)
        ├── components/            Composants réutilisables
        ├── pages/                 Pages (visiteur, member/, admin/)
        └── App.jsx                Plan du site
```

### Base de données

```
users ───< loans >─── books >─── categories
  │                     │
  └──< reservations >───┘
```

| Table | Rôle | Points importants |
|---|---|---|
| `users` | Adhérents et bibliothécaires | `role` : `adherent` ou `bibliothecaire` |
| `categories` | Roman, BD, Jeunesse… | nom unique + `slug` pour les URL |
| `books` | Catalogue | `total_copies` = exemplaires physiques ; **suppression douce** (`deleted_at`) pour garder l'historique |
| `loans` | Emprunts | `returned_at` vide = en cours ; en retard = en cours **et** `due_at` dépassée (calculé, jamais stocké) ; `extended` (règle 4) |
| `reservations` | File d'attente | `status` : `en_attente` → `disponible` → `honoree` / `annulee` / `expiree` ; `created_at` = ordre d'arrivée |

**Exemplaires disponibles** = `total_copies` − emprunts en cours − réservations « mises de côté ».

---

## 8. API REST

Toutes les routes sont préfixées par `/api`. Les routes protégées attendent l'en-tête `Authorization: Bearer <jeton>`.

| Accès | Méthode | Route | Rôle |
|---|---|---|---|
| Public | POST | `/auth/register`, `/auth/login` | Inscription, connexion (→ jeton) |
| Public | GET | `/books?search=&category=&available=1&sort=&page=` | Catalogue |
| Public | GET | `/books/{id}` | Fiche livre (+ bloc `viewer` si un adhérent est connecté) |
| Public | GET | `/categories` | Catégories |
| Connecté | GET / POST | `/auth/me`, `/auth/logout` | Utilisateur courant, déconnexion |
| Adhérent | GET | `/my/summary` | Résumé (emprunts, retards, réservations) |
| Adhérent | GET | `/my/loans` · `/my/loans?status=history` | Emprunts en cours · historique |
| Adhérent | POST | `/my/loans/{id}/extend` | Prolonger (règle 4) |
| Adhérent | GET / POST / DELETE | `/my/reservations[/{id}]` | Lister, réserver (règles 3, 5), annuler |
| Bibliothécaire | GET | `/admin/dashboard` | Tableau de bord |
| Bibliothécaire | GET | `/admin/members?search=` | Recherche d'adhérents |
| Bibliothécaire | GET / POST | `/admin/loans` | Lister / enregistrer un prêt (règles 1, 2, 3, 6) |
| Bibliothécaire | POST | `/admin/loans/{id}/return` | Enregistrer un retour (règle 6) |
| Bibliothécaire | POST / PUT / DELETE | `/admin/books[/{id}]` | Gérer les livres (règle 7) |
| Bibliothécaire | POST / PUT / DELETE | `/admin/categories[/{id}]` | Gérer les catégories |

Liste complète : `php artisan route:list --path=api`

Codes de réponse : `401` non connecté · `403` mauvais rôle · `404` introuvable · `422` données invalides **ou règle non respectée** (avec un `message` en français) · `429` trop de tentatives de connexion.

---

## 9. Sécurité

- **Authentification par jeton** (Laravel Sanctum) ; le jeton expire au bout de 7 jours et est supprimé à la déconnexion.
- **Trois niveaux d'accès** : public, `auth:sanctum` (connecté), `role:adherent` / `role:bibliothecaire`.
- **Chacun n'accède qu'à ce qui le concerne** : les routes `/my/...` partent toujours de l'utilisateur connecté ;
  agir sur l'emprunt ou la réservation d'un autre renvoie 404.
- **Impossible de s'inscrire comme bibliothécaire** : le champ `role` n'est pas assignable depuis une requête.
- **Mots de passe hachés** (bcrypt), jamais renvoyés par l'API.
- **5 tentatives de connexion par minute** maximum (protection contre la force brute).
- **CORS** limité à l'adresse du front-end (`FRONTEND_URL` dans `backend/.env`).
- Le contrôle des rôles dans React n'est qu'un confort d'affichage : **la vraie protection est dans l'API**.

---

## 10. Dépannage

| Problème | Solution |
|---|---|
| `ERR_CONNECTION_REFUSED` sur `localhost:5173` | Le front n'est pas lancé : `npm run dev` dans `frontend/` |
| « Impossible de joindre le serveur » dans l'interface | L'API n'est pas lancée : `php artisan serve` dans `backend/` |
| Erreur 500 / `SQLSTATE[HY000] [2002]` | MySQL n'est pas démarré, ou les identifiants de `backend/.env` sont faux |
| Erreur CORS dans la console du navigateur | Le front tourne sur une autre adresse : l'ajouter à `FRONTEND_URL` dans `backend/.env`, puis `php artisan config:clear` |
| « Trop de tentatives… » à la connexion | Protection anti-force brute : patienter une minute |
| `composer install` extrêmement lent | Le réseau bloque les téléchargements depuis GitHub : essayer une autre connexion (partage de connexion du téléphone par exemple) |
| `'vite' n'est pas reconnu` | Lancer `npm install` puis `npm run dev` **dans `frontend/`** (pas dans `backend/`) |
| Appuyer sur `Ctrl + C` dans un terminal arrête le serveur | Pour copier du texte d'un terminal Windows : sélectionner puis `Entrée` |
