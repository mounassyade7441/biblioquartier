import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { createBook, updateBook } from '../../api/admin'
import { fetchBook, fetchCategories } from '../../api/catalog'
import { getErrorMessage, getFieldErrors } from '../../api/errors'
import BookCover from '../../components/books/BookCover'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import { IconArrowLeft } from '../../components/ui/Icons'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const EMPTY = { title: '', author: '', category_id: '', total_copies: 1, published_year: '', isbn: '', cover_url: '', summary: '' }

/**
 * Ajouter (/admin/livres/nouveau) ou modifier (/admin/livres/:id/modifier) un livre.
 * Le même formulaire sert aux deux : seul l'appel final change (POST ou PUT).
 */
export default function BookFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  useDocumentTitle(editing ? 'Modifier un livre' : 'Ajouter un livre')

  const categories = useAsync(fetchCategories, [])
  const existing = useAsync(() => (editing ? fetchBook(id) : Promise.resolve(null)), [id])

  if (categories.loading || (editing && existing.loading && !existing.data)) return <Spinner />
  if (existing.error || categories.error) return <Alert type="error">{existing.error || categories.error}</Alert>

  // key : on recrée le formulaire avec les bonnes valeurs initiales une fois le livre chargé
  return <BookForm key={id ?? 'new'} book={existing.data?.data} categories={categories.data} />
}

function BookForm({ book, categories }) {
  const navigate = useNavigate()
  const editing = Boolean(book)

  const [form, setForm] = useState(() =>
    book
      ? {
          title: book.title,
          author: book.author,
          category_id: book.category?.id ?? '',
          total_copies: book.total_copies,
          published_year: book.published_year ?? '',
          isbn: book.isbn ?? '',
          cover_url: book.cover_url ?? '',
          summary: book.summary ?? '',
        }
      : EMPTY,
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})

    // Champs facultatifs vides → null ; nombres → nombres
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      total_copies: Number(form.total_copies),
      published_year: form.published_year ? Number(form.published_year) : null,
      isbn: form.isbn || null,
      cover_url: form.cover_url || null,
      summary: form.summary || null,
    }

    try {
      const result = editing ? await updateBook(book.id, payload) : await createBook(payload)
      navigate('/admin/livres', { state: { flash: result.message } })
    } catch (err) {
      const fields = getFieldErrors(err)
      setFieldErrors(fields)
      setError(Object.keys(fields).length ? 'Merci de corriger les champs indiqués.' : getErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <>
      <Link to="/admin/livres" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-brand-700">
        <IconArrowLeft className="size-4" /> Retour aux livres
      </Link>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">{editing ? `Modifier « ${book.title} »` : 'Ajouter un livre'}</h1>

      <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_220px]">
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          {error && <Alert type="error">{error}</Alert>}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Titre" name="title" required value={form.title} onChange={update} error={fieldErrors.title} className="sm:col-span-2" />
            <FormField label="Auteur" name="author" required value={form.author} onChange={update} error={fieldErrors.author} />
            <FormField as="select" label="Catégorie" name="category_id" required value={form.category_id} onChange={update} error={fieldErrors.category_id}>
              <option value="">— Choisir —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Nombre d'exemplaires"
              name="total_copies"
              type="number"
              min="1"
              max="999"
              required
              value={form.total_copies}
              onChange={update}
              error={fieldErrors.total_copies}
              hint="Exemplaires physiques possédés par la bibliothèque."
            />
            <FormField label="Année de publication" name="published_year" type="number" value={form.published_year} onChange={update} error={fieldErrors.published_year} />
            <FormField label="ISBN" name="isbn" value={form.isbn} onChange={update} error={fieldErrors.isbn} />
            <FormField
              label="Image de couverture (adresse web)"
              name="cover_url"
              type="url"
              placeholder="https://…"
              value={form.cover_url}
              onChange={update}
              error={fieldErrors.cover_url}
              hint="Facultatif — sinon une couverture est générée."
            />
            <FormField as="textarea" label="Résumé" name="summary" rows={5} value={form.summary} onChange={update} error={fieldErrors.summary} className="sm:col-span-2" />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
            <Link to="/admin/livres" className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-stone-50">
              Annuler
            </Link>
            <Button type="submit" loading={busy}>
              {editing ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
            </Button>
          </div>
        </div>

        {/* Aperçu en direct de la couverture */}
        <aside className="hidden lg:block">
          <p className="mb-2 text-sm font-medium text-stone-600">Aperçu</p>
          {/* key : une nouvelle adresse d'image = un nouvel essai de chargement */}
          <BookCover
            key={form.cover_url}
            book={{ title: form.title || 'Titre du livre', author: form.author || 'Auteur', cover_url: form.cover_url }}
            size="lg"
          />
        </aside>
      </form>
    </>
  )
}
