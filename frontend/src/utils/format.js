/** Petites fonctions de mise en forme, en français. */

// Fuseau horaire fixé à celui de la bibliothèque : une date limite "1er décembre" doit
// s'afficher "1er décembre" pour tout le monde, quel que soit le réglage de l'ordinateur.
const TIME_ZONE = 'Europe/Paris'

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: TIME_ZONE })

/** "2026-11-28T23:59:59+01:00" → "28 novembre 2026" */
export function formatDate(iso) {
  return iso ? longDate.format(new Date(iso)) : ''
}

/** "2026-11-28T23:59:59+01:00" → "28 nov." */
export function formatShortDate(iso) {
  return iso ? shortDate.format(new Date(iso)) : ''
}

/** pluralize(1, 'livre') → "1 livre" ; pluralize(3, 'livre') → "3 livres" */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count > 1 ? plural : singular}`
}
