import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { fetchBooks, fetchCategories } from '../api/catalog'
import BookCard from '../components/books/BookCard'
import CatalogFilters from '../components/books/CatalogFilters'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Pagination from '../components/ui/Pagination'
import Spinner from '../components/ui/Spinner'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { pluralize } from '../utils/format'

/**
 * Catalogue : recherche, filtre par catégorie, disponibles seulement, tri, pagination.
 *
 * Les filtres sont stockés DANS L'URL (?q=dune&categorie=bd&page=2) :
 * - le bouton "Précédent" du navigateur fonctionne
 * - on peut partager ou mettre en favori une recherche
 * - un rechargement de page conserve les filtres
 */
export default function CatalogPage() {
  useDocumentTitle('Catalogue')
  const [params, setParams] = useSearchParams()

  const q = params.get('q') ?? ''
  const category = params.get('categorie')
  const availableOnly = params.get('dispo') === '1'
  const sort = params.get('tri') ?? 'title'
  const page = Number(params.get('page') ?? 1)

  /** Modifie un ou plusieurs paramètres d'URL (null = supprimer). */
  function updateParams(changes, { resetPage = true } = {}) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === '' || value === false) next.delete(key)
        else next.set(key, value)
      })
      if (resetPage) next.delete('page') // nouveau filtre → retour en page 1
      return next
    })
  }

  // Recherche : le champ est mis à jour à chaque touche, mais l'URL (et donc l'appel API)
  // seulement 350 ms après la dernière frappe → pas une requête par lettre tapée ("debounce").
  const [query, setQuery] = useState(q)

  // Si l'URL change autrement (lien "Catalogue", bouton Précédent…), le champ suit.
  // (Ajustement d'état pendant le rendu : méthode recommandée par React, sans useEffect.)
  const [previousQ, setPreviousQ] = useState(q)
  if (q !== previousQ) {
    setPreviousQ(q)
    setQuery(q)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== q) updateParams({ q: query.trim() })
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const categories = useAsync(fetchCategories, [])
  const books = useAsync(
    () =>
      fetchBooks({
        search: q || undefined,
        category: category || undefined,
        available: availableOnly ? 1 : undefined,
        sort,
        page,
        per_page: 12,
      }),
    [q, category, availableOnly, sort, page],
  )

  function goToPage(newPage) {
    updateParams({ page: newPage > 1 ? newPage : null }, { resetPage: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetFilters() {
    setQuery('')
    setParams(new URLSearchParams())
  }

  const hasFilters = Boolean(q || category || availableOnly)
  const activeCategory = categories.data?.find((c) => c.slug === category)

  return (
    <>
      <section className="mb-6 sm:mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Le catalogue</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Que voulez-vous lire ?</h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Recherchez un livre, filtrez par catégorie et vérifiez en un coup d'œil s'il est disponible.
        </p>
      </section>

      <CatalogFilters
        query={query}
        onQueryChange={setQuery}
        categories={categories.data ?? []}
        category={category}
        onCategoryChange={(slug) => updateParams({ categorie: slug })}
        availableOnly={availableOnly}
        onAvailableOnlyChange={(checked) => updateParams({ dispo: checked ? '1' : null })}
        sort={sort}
        onSortChange={(value) => updateParams({ tri: value === 'title' ? null : value })}
      />

      <div className="mt-8">
        {books.loading && !books.data && <Spinner label="Chargement du catalogue…" />}

        {books.error && (
          <Alert
            type="error"
            title="Le catalogue n'a pas pu être chargé"
            action={
              <Button variant="danger" size="sm" onClick={books.reload}>
                Réessayer
              </Button>
            }
          >
            {books.error}
          </Alert>
        )}

        {books.data && (
          // Pendant un rechargement, on garde les anciens résultats en transparence
          <div className={`transition-opacity ${books.loading ? 'opacity-50' : ''}`} aria-busy={books.loading}>
            {/* aria-live : le nombre de résultats est annoncé aux lecteurs d'écran */}
            <p className="mb-5 text-sm text-stone-600" aria-live="polite">
              <span className="font-semibold text-ink">{pluralize(books.data.meta.total, 'livre')}</span>
              {q && <> pour « {q} »</>}
              {activeCategory && <> en {activeCategory.name}</>}
              {availableOnly && <>, disponibles maintenant</>}
            </p>

            {books.data.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
                <p className="font-serif text-xl font-semibold">Aucun livre trouvé</p>
                <p className="mt-1 text-sm text-stone-600">Essayez avec un autre mot, ou retirez des filtres.</p>
                {hasFilters && (
                  <Button variant="secondary" className="mt-5" onClick={resetFilters}>
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                {books.data.data.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            <Pagination currentPage={books.data.meta.current_page} lastPage={books.data.meta.last_page} onChange={goToPage} />
          </div>
        )}
      </div>
    </>
  )
}
