/** Petites fonctions de mise en forme, en français. */

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

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
