import axios from 'axios'

/**
 * Client HTTP unique pour toute l'application.
 * Tous les appels à l'API passent par lui : l'adresse de l'API, les en-têtes
 * et le jeton de connexion sont donc gérés à UN SEUL endroit.
 */

export const TOKEN_KEY = 'biblioquartier_token'

const api = axios.create({
  // Lue dans frontend/.env (VITE_API_URL), avec une valeur par défaut
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' }, // Laravel répond toujours en JSON
  timeout: 15000,
})

/** Lit le jeton enregistré (try/catch : le stockage peut être bloqué en navigation privée). */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * "Intercepteur" de requête : avant CHAQUE appel, on ajoute automatiquement
 * l'en-tête  Authorization: Bearer <jeton>  si l'utilisateur est connecté.
 */
api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
