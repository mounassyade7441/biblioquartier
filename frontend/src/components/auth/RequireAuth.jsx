import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { homePathFor } from '../../context/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

/**
 * "Garde" des pages protégées. S'utilise comme une route parente :
 *
 *   <Route element={<RequireAuth role="adherent" />}>
 *     <Route path="mon-espace" element={<MemberHomePage />} />
 *   </Route>
 *
 * - pas connecté          → redirection vers /connexion (puis retour à la page demandée)
 * - connecté, mauvais rôle → message "accès réservé"
 *
 * ⚠️ C'est un confort d'interface : la VRAIE sécurité est dans l'API Laravel
 * (auth:sanctum + role:…), qui refuse de toute façon les requêtes non autorisées.
 */
export default function RequireAuth({ role }) {
  const { user, loading, loggedOut } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner label="Vérification de votre session…" />
  }

  if (!user) {
    // Déconnexion volontaire depuis cette page → retour au catalogue
    if (loggedOut) {
      return <Navigate to="/" replace />
    }
    // Sinon (visiteur, session expirée) → connexion.
    // state.from : pour revenir ici après la connexion
    return <Navigate to="/connexion" replace state={{ from: location.pathname + location.search }} />
  }

  if (role && user.role !== role) {
    return (
      <section className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold">Accès réservé</h1>
        <p className="mt-2 text-stone-600">
          {role === 'bibliothecaire'
            ? "Cette page est réservée aux bibliothécaires de l'association."
            : 'Cette page est réservée aux adhérents.'}
        </p>
        <Link
          to={homePathFor(user)}
          className="mt-6 inline-flex rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
        >
          Retour à mon espace
        </Link>
      </section>
    )
  }

  return <Outlet />
}
