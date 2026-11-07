import axios from 'axios'

/**
 * Client HTTP unique pour toute l'application.
 * Tous les appels à l'API passent par lui : l'adresse de l'API, les en-têtes
 * et le jeton de connexion sont donc gérés à UN SEUL endroit.
 */

const TOKEN_KEY = 'biblioquartier_token'

/** Événement envoyé quand l'API répond 401 (jeton expiré ou supprimé). */
export const SESSION_EXPIRED_EVENT = 'biblioquartier:session-expired'

const api = axios.create({
  // Lue dans frontend/.env (VITE_API_URL), avec une valeur par défaut
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' }, // Laravel répond toujours en JSON
  timeout: 15000,
})

// ---------- Stockage du jeton ----------
// try/catch : le stockage du navigateur peut être bloqué (navigation privée stricte…)

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* stockage indisponible : la session durera le temps de l'onglet */
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* rien à faire */
  }
}

// ---------- Intercepteurs ----------

/**
 * Avant CHAQUE requête : on ajoute automatiquement
 * l'en-tête  Authorization: Bearer <jeton>  si l'utilisateur est connecté.
 */
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Après CHAQUE réponse : si l'API répond 401 alors qu'on avait envoyé un jeton,
 * c'est que la session a expiré (7 jours) → on oublie le jeton et on prévient
 * l'application (AuthProvider écoute cet événement et déconnecte l'utilisateur).
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization)
    if (error.response?.status === 401 && sentToken) {
      clearStoredToken()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  },
)

export default api
