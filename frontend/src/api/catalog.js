import api from './client'

/**
 * Appels à l'API publique du catalogue.
 * Chaque fonction renvoie directement les données utiles (pas l'objet Axios complet).
 */

/** Liste paginée : { data: [...livres], meta: { current_page, last_page, total, ... } } */
export async function fetchBooks(params = {}) {
  const { data } = await api.get('/books', { params })
  return data
}

/** Fiche d'un livre : { data: livre, viewer: {...} | null } */
export async function fetchBook(id) {
  const { data } = await api.get(`/books/${id}`)
  return data
}

/** Liste des catégories avec leur nombre de livres */
export async function fetchCategories() {
  const { data } = await api.get('/categories')
  return data.data
}
