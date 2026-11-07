import api from './client'

/**
 * Appels de l'espace adhérent (routes /api/my/…, réservées aux adhérents connectés).
 * Voir backend : app/Http/Controllers/Api/Member/
 */

/** Réserver un livre entièrement emprunté (règles 3 et 5) → { message, data: réservation } */
export async function reserveBook(bookId) {
  const { data } = await api.post('/my/reservations', { book_id: bookId })
  return data
}

/** Annuler une de ses réservations → { message } */
export async function cancelReservation(reservationId) {
  const { data } = await api.delete(`/my/reservations/${reservationId}`)
  return data
}
