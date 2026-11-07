import { fetchBooks } from '../api/catalog'
import BookCard from '../components/books/BookCard'
import Alert from '../components/ui/Alert'
import Spinner from '../components/ui/Spinner'
import { useAsync } from '../hooks/useAsync'

/**
 * Page d'accueil : le catalogue.
 * Étape 10 : affichage de la première page de livres (preuve que React parle à l'API).
 * Étape 12 : recherche, filtre par catégorie, pagination.
 */
export default function CatalogPage() {
  const { data, loading, error, reload } = useAsync(() => fetchBooks({ per_page: 12 }), [])

  return (
    <>
      <section className="mb-8 sm:mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Le catalogue</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Que voulez-vous lire ?
        </h1>
        <p className="mt-2 max-w-2xl text-stone-600">
          Parcourez les livres de la bibliothèque et vérifiez en un coup d'œil s'ils sont disponibles.
        </p>
      </section>

      {loading && !data && <Spinner label="Chargement du catalogue…" />}

      {error && (
        <Alert
          type="error"
          title="Le catalogue n'a pas pu être chargé"
          action={
            <button onClick={reload} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
              Réessayer
            </button>
          }
        >
          {error}
        </Alert>
      )}

      {data && (
        <>
          <p className="mb-4 text-sm text-stone-500">{data.meta.total} livres au catalogue</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {data.data.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
