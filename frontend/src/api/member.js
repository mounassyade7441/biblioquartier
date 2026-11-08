import api from './client'

/**
 * Appels de l'espace adhérent (routes /api/my/…, réservées aux adhérents connectés).
 * Le serveur filtre toujours sur l'utilisateur connecté : impossible de voir les données d'un autre.
 * Voir backend : app/Http/Controllers/Api/Member/
 */

/** Résumé : { active_loans_count, max_loans, overdue_count, can_borrow, can_reserve, waiting_reservations_count, ready_reservations_count } */
export async function fetchSummary() {
  const { data } = await api.get('/my/summary')
  return data.data
}

/** Emprunts en cours (tableau, les plus urgents d'abord) */
export async function fetchActiveLoans() {
  const { data } = await api.get('/my/loans')
  return data.data
}

/** Historique paginé des emprunts rendus → { data, meta } */
export async function fetchLoanHistory(page = 1) {
  const { data } = await api.get('/my/loans', { params: { status: 'history', page } })
  return data
}

/** Prolonger un emprunt d'une semaine (règle 4) → { message, data: emprunt } */
export async function extendLoan(loanId) {
  const { data } = await api.post(`/my/loans/${loanId}/extend`)
  return data
}

/** Réservations actives (livres prêts en premier) */
export async function fetchMyReservations() {
  const { data } = await api.get('/my/reservations')
  return data.data
}

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
