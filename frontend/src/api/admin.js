import api from './client'

/**
 * Appels de l'espace bibliothécaire (routes /api/admin/…, réservées au rôle "bibliothecaire").
 * Voir backend : app/Http/Controllers/Api/Admin/
 */

// ---------- Tableau de bord ----------

/** { stats, overdue_loans, due_soon, ready_reservations, top_books, monthly_loans } */
export async function fetchDashboard() {
  const { data } = await api.get('/admin/dashboard')
  return data.data
}

// ---------- Adhérents ----------

/** Recherche d'adhérents (nom ou e-mail) → { data, meta } */
export async function searchMembers(search = '', perPage = 8) {
  const { data } = await api.get('/admin/members', { params: { search: search || undefined, per_page: perPage } })
  return data
}

// ---------- Prêts et retours ----------

/** status : active | overdue | returned | all → { data, meta } */
export async function fetchLoans({ status = 'active', search = '', page = 1 } = {}) {
  const { data } = await api.get('/admin/loans', { params: { status, search: search || undefined, page } })
  return data
}

/** Enregistrer un prêt (règles 1, 2, 3, 6 vérifiées par le serveur) → { message, data } */
export async function createLoan(userId, bookId) {
  const { data } = await api.post('/admin/loans', { user_id: userId, book_id: bookId })
  return data
}

/** Enregistrer un retour → { message, data, held_for } (held_for : à mettre de côté, règle 6) */
export async function returnLoan(loanId) {
  const { data } = await api.post(`/admin/loans/${loanId}/return`)
  return data
}

// ---------- Livres ----------

export async function createBook(payload) {
  const { data } = await api.post('/admin/books', payload)
  return data
}

export async function updateBook(id, payload) {
  const { data } = await api.put(`/admin/books/${id}`, payload)
  return data
}

/** Retirer du catalogue (refusé si le livre est emprunté : règle 7) */
export async function deleteBook(id) {
  const { data } = await api.delete(`/admin/books/${id}`)
  return data
}

// ---------- Catégories ----------

export async function createCategory(name) {
  const { data } = await api.post('/admin/categories', { name })
  return data
}

export async function updateCategory(id, name) {
  const { data } = await api.put(`/admin/categories/${id}`, { name })
  return data
}

/** Refusé si la catégorie contient encore des livres */
export async function deleteCategory(id) {
  const { data } = await api.delete(`/admin/categories/${id}`)
  return data
}
