# BiblioQuartier — Interface (React)

Interface web de BiblioQuartier (React + Vite + Tailwind CSS). **Le guide complet est dans le [README principal](../README.md).**

## Démarrage rapide

```bash
npm install
cp .env.example .env    # Windows (cmd) : copy .env.example .env
npm run dev             # → http://localhost:5173 (l'API doit tourner sur http://127.0.0.1:8000)
```

Autres commandes : `npm run build` (version de production dans `dist/`), `npm run lint` (vérification du code).

## Où trouver quoi

| Dossier | Contenu |
|---|---|
| `src/api/` | Appels à l'API (client Axios avec jeton automatique, traduction des erreurs) |
| `src/context/`, `src/hooks/useAuth.js` | Utilisateur connecté, connexion / déconnexion |
| `src/components/auth/RequireAuth.jsx` | Protection des pages selon le rôle |
| `src/pages/` | Une page = un fichier (`member/` adhérent, `admin/` bibliothécaire) |
| `src/components/` | Composants réutilisables (`ui/`, `books/`, `member/`, `admin/`, `layout/`) |
| `src/App.jsx` | Plan du site (toutes les routes) |
