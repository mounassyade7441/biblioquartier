/**
 * Transforme une erreur Axios en message compréhensible pour l'utilisateur.
 * L'API Laravel renvoie déjà des messages en français dans "message" :
 * on les affiche tels quels, et on traduit les cas techniques.
 */
export function getErrorMessage(error, fallback = 'Une erreur est survenue. Merci de réessayer.') {
  // Pas de réponse du tout : serveur éteint, pas de réseau, CORS…
  if (!error?.response) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion internet et réessayez."
  }

  const { status, data } = error.response

  if (status >= 500) {
    return 'Le serveur a rencontré un problème. Merci de réessayer dans quelques instants.'
  }

  return data?.message || fallback
}

/**
 * Erreurs de validation champ par champ (réponse 422 de Laravel) :
 * { email: ["Un compte existe déjà…"], password: ["…"] } → { email: "Un compte…", password: "…" }
 */
export function getFieldErrors(error) {
  const errors = error?.response?.status === 422 ? error.response.data?.errors : null
  if (!errors) return {}

  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0]]))
}
