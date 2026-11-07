import { createContext } from 'react'

/**
 * Le "contexte" d'authentification : une boîte partagée par toute l'application,
 * qui contient l'utilisateur connecté et les fonctions login / register / logout.
 * Il est rempli par <AuthProvider> et lu avec le hook useAuth().
 */
export const AuthContext = createContext(null)

export const ROLES = {
  ADHERENT: 'adherent',
  BIBLIOTHECAIRE: 'bibliothecaire',
}

/** Page d'accueil de chaque rôle après connexion */
export function homePathFor(user) {
  if (user?.role === ROLES.BIBLIOTHECAIRE) return '/admin'
  if (user?.role === ROLES.ADHERENT) return '/mon-espace'
  return '/'
}
