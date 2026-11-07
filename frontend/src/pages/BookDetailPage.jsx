import { Link, useNavigate, useParams } from 'react-router'
import { fetchBook } from '../api/catalog'
import AvailabilityPanel from '../components/books/AvailabilityPanel'
import BookCover from '../components/books/BookCover'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import { IconArrowLeft } from '../components/ui/Icons'
import Spinner from '../components/ui/Spinner'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/**
 * Fiche d'un livre : couverture, résumé, auteur, disponibilité.
 * URL : /livres/:id  (ex. /livres/12)
 */
export default function BookDetailPage() {
  const { id } = useParams() // le ":id" de l'URL
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => fetchBook(id), [id])

  const book = data?.data
  useDocumentTitle(book?.title ?? 'Livre')

  // Retour : page précédente si on vient du catalogue (filtres conservés), sinon le catalogue
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        className="mb-6 inline-flex items-center gap-2 rounded-lg py-1 text-sm font-medium text-stone-600 hover:text-brand-700"
      >
        <IconArrowLeft className="size-4" />
        Retour au catalogue
      </button>

      {loading && !book && <Spinner label="Chargement du livre…" />}

      {error && (
        <Alert
          type="error"
          title={error === 'Ressource introuvable.' ? "Ce livre n'existe pas ou a été retiré du catalogue" : 'Le livre n’a pas pu être chargé'}
          action={
            error === 'Ressource introuvable.' ? (
              <Link to="/" className="text-sm font-medium underline">
                Voir le catalogue
              </Link>
            ) : (
              <Button variant="danger" size="sm" onClick={reload}>
                Réessayer
              </Button>
            )
          }
        />
      )}

      {book && (
        <article className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-12">
          <div className="mx-auto w-full max-w-[180px] sm:max-w-[220px] md:max-w-none">
            <BookCover book={book} size="lg" />
          </div>

          <div className="min-w-0">
            {book.category && (
              <Link
                to={`/?categorie=${book.category.slug}`}
                className="text-sm font-semibold uppercase tracking-wider text-brand-700 hover:underline"
              >
                {book.category.name}
              </Link>
            )}
            <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">{book.title}</h1>
            <p className="mt-2 text-lg text-stone-700">
              par{' '}
              <Link to={`/?q=${encodeURIComponent(book.author)}`} className="font-medium hover:text-brand-700 hover:underline">
                {book.author}
              </Link>
            </p>

            <div className="mt-6">
              <AvailabilityPanel book={book} viewer={data.viewer} onChanged={reload} refreshing={loading} />
            </div>

            {book.summary && (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">Résumé</h2>
                <p className="mt-2 max-w-prose leading-relaxed text-stone-700">{book.summary}</p>
              </section>
            )}

            <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {book.published_year && (
                <>
                  <dt className="text-stone-500">Année de publication</dt>
                  <dd className="font-medium">{book.published_year}</dd>
                </>
              )}
              {book.isbn && (
                <>
                  <dt className="text-stone-500">ISBN</dt>
                  <dd className="font-medium">{book.isbn}</dd>
                </>
              )}
              <dt className="text-stone-500">Exemplaires</dt>
              <dd className="font-medium">{book.total_copies}</dd>
            </dl>
          </div>
        </article>
      )}
    </>
  )
}
