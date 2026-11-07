import api from './client'

/** Appels d'authentification (voir backend : app/Http/Controllers/Api/AuthController.php). */

/** → { message, token, user } */
export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/** payload = { name, email, phone, password, password_confirmation } → { message, token, user } */
export async function registerRequest(payload) {
  const { data } = await api.post('/auth/register', payload)
  return data
}

/** Utilisateur correspondant au jeton enregistré */
export async function fetchMe() {
  const { data } = await api.get('/auth/me')
  return data.user
}

/**
 * Supprime le jeton côté serveur.
 * Le jeton est passé explicitement car il a déjà été effacé du navigateur.
 */
export async function logoutRequest(token) {
  await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } })
}
