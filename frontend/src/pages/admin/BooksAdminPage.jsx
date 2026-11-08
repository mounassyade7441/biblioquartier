import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { deleteBook } from '../../api/admin'
import { fetchBooks } from '../../api/catalog'
import { getErrorMessage } from '../../api/errors'
import BookCover from '../../components/books/BookCover'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { IconSearch } from '../../components/ui/Icons'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { pluralize } from '../../utils/format'

/**
 * Gestion des livres (bibliothécaire) : liste, recherche, modifier, retirer.
 * Retirer un livre emprunté est refusé par le serveur (règle 7) : on affiche son message.
 */
export default function BooksAdminPage() {
  useDocumentTitle('Gestion des livres')
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const search = useDebouncedValue(query.trim(), 300)
  const books = useAsync(() => fetchBooks({ search: search || undefined, page, per_page: 15 }), [search, page])

  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(location.state?.flash ? { type: 'success', text: location.state.flash } : null)

  async function confirmDelete() {
    setBusy(true)
    try {
      const result = await deleteBook(toDelete.id)
      setNotice({ type: 'success', text: result.message })
      books.reload()
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusy(false)
      setToDelete(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Livres</h1>
        <Link to="/admin/livres/nouveau" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800">
          + Ajouter un livre
        </Link>
      </div>

      {notice && (
        <Alert type={notice.type} className="mb-5" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="relative mb-5 sm:max-w-sm">
        <label htmlFor="book-admin-search" className="sr-only">Rechercher un livre</label>
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          id="book-admin-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Titre ou auteur…"
          className="block w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:text-sm"
        />
      </div>

      {books.loading && !books.data && <Spinner label="Chargement des livres…" />}
      {books.error && <Alert type="error" action={<Button variant="danger" size="sm" onClick={books.reload}>Réessayer</Button>}>{books.error}</Alert>}

      {books.data && (
        <div className={books.loading ? 'opacity-60 transition-opacity' : ''}>
          <p className="mb-3 text-sm text-stone-600" aria-live="polite">{pluralize(books.data.meta.total, 'livre')}</p>
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            {books.data.data.map((book) => {
              const out = book.total_copies - book.available_copies
              return (
                <li key={book.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-5">
                  <div className="w-10 shrink-0">
                    <BookCover book={book} />
                  </div>
                  <div className="min-w-0 flex-1 basis-48">
                    <Link to={`/livres/${book.id}`} className="font-medium text-ink hover:text-brand-700">
                      {book.title}
                    </Link>
                    <p className="truncate text-sm text-stone-500">
                      {book.author}
                      {book.category && <> · {book.category.name}</>}
                    </p>
                  </div>
                  <div className="text-sm text-stone-700 sm:w-40">
                    <span className="font-semibold tabular-nums">{book.available_copies}</span> / {book.total_copies} en rayon
                    {out > 0 && <span className="block text-xs text-stone-500">{pluralize(out, 'emprunté')} ou mis de côté</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/livres/${book.id}/modifier`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
                      Modifier
                    </Link>
                    <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => setToDelete(book)} disabled={busy}>
                      Retirer
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination currentPage={books.data.meta.current_page} lastPage={books.data.meta.last_page} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Retirer ce livre du catalogue ?"
        confirmLabel="Retirer"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        « {toDelete?.title} » ne sera plus visible dans le catalogue. L'historique des emprunts est conservé. Les réservations en
        cours seront annulées.
      </ConfirmDialog>
    </>
  )
}
