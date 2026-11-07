import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMe, loginRequest, logoutRequest, registerRequest } from '../api/auth'
import { clearStoredToken, getStoredToken, SESSION_EXPIRED_EVENT, setStoredToken } from '../api/client'
import { AuthContext, ROLES } from './AuthContext'

/**
 * Fournit l'utilisateur connecté à toute l'application.
 *
 * Au démarrage : s'il y a un jeton enregistré (l'utilisateur s'était connecté
 * lors d'une visite précédente), on demande à l'API "qui suis-je ?" (/auth/me).
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true juste après une déconnexion VOLONTAIRE (bouton) — voir RequireAuth
  const [loggedOut, setLoggedOut] = useState(false)
  // On ne "charge" que s'il y a un jeton à vérifier
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()))

  // 1. Restaurer la session au chargement de la page
  useEffect(() => {
    if (!getStoredToken()) return

    fetchMe()
      .then(setUser)
      .catch(() => clearStoredToken()) // jeton expiré ou invalide
      .finally(() => setLoading(false))
  }, [])

  // 2. Si l'API répond 401 plus tard (jeton expiré), on déconnecte
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password)
    setStoredToken(data.token)
    setLoggedOut(false)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await registerRequest(payload)
    setStoredToken(data.token)
    setLoggedOut(false)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    const token = getStoredToken()
    // 1. Déconnexion immédiate dans l'interface (pas d'attente du serveur)
    clearStoredToken()
    setLoggedOut(true)
    setUser(null)
    // 2. Le serveur supprime le jeton en arrière-plan ; s'il ne répond pas, tant pis :
    //    le jeton n'est plus connu du navigateur et expirera de lui-même.
    if (token) logoutRequest(token).catch(() => {})
  }, [])

  // useMemo : l'objet n'est recréé que si l'utilisateur change (évite des rendus inutiles)
  const value = useMemo(
    () => ({
      user,
      loading,
      loggedOut,
      isAuthenticated: Boolean(user),
      isAdherent: user?.role === ROLES.ADHERENT,
      isLibrarian: user?.role === ROLES.BIBLIOTHECAIRE,
      login,
      register,
      logout,
    }),
    [user, loading, loggedOut, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
