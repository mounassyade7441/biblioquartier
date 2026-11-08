import { useState } from 'react'
import { createCategory, deleteCategory, updateCategory } from '../../api/admin'
import { fetchCategories } from '../../api/catalog'
import { getErrorMessage, getFieldErrors } from '../../api/errors'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { pluralize } from '../../utils/format'

/**
 * Gestion des catégories (bibliothécaire) : ajouter, renommer, supprimer.
 * Supprimer une catégorie qui contient des livres est refusé par le serveur.
 */
export default function CategoriesPage() {
  useDocumentTitle('Catégories')
  const categories = useAsync(fetchCategories, [])

  const [newName, setNewName] = useState('')
  const [newError, setNewError] = useState(null)
  const [editing, setEditing] = useState(null) // { id, name, error }
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  /** Exécute une action et affiche le message du serveur. */
  async function run(action, { onFieldError } = {}) {
    setBusy(true)
    try {
      const result = await action()
      setNotice({ type: 'success', text: result.message })
      categories.reload()
      return true
    } catch (error) {
      const fieldError = getFieldErrors(error).name
      if (fieldError && onFieldError) onFieldError(fieldError)
      else setNotice({ type: 'error', text: getErrorMessage(error) })
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    setNewError(null)
    if (await run(() => createCategory(newName), { onFieldError: setNewError })) setNewName('')
  }

  async function handleRename(event) {
    event.preventDefault()
    const ok = await run(() => updateCategory(editing.id, editing.name), {
      onFieldError: (message) => setEditing((e) => ({ ...e, error: message })),
    })
    if (ok) setEditing(null)
  }

  async function handleDelete() {
    await run(() => deleteCategory(toDelete.id))
    setToDelete(null)
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Catégories</h1>

      {notice && (
        <Alert type={notice.type} className="mb-5" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ---------- Liste ---------- */}
        <section>
          {categories.loading && !categories.data && <Spinner />}
          {categories.error && <Alert type="error">{categories.error}</Alert>}
          {categories.data && (
            <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {categories.data.map((category) => (
                <li key={category.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  {editing?.id === category.id ? (
                    <form onSubmit={handleRename} className="flex w-full flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`rename-${category.id}`} className="sr-only">Nouveau nom</label>
                        <input
                          id={`rename-${category.id}`}
                          value={editing.name}
                          onChange={(e) => setEditing({ ...editing, name: e.target.value, error: null })}
                          autoFocus
                          aria-invalid={Boolean(editing.error)}
                          className="block w-full rounded-lg border border-stone-300 px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:text-sm"
                        />
                        {editing.error && <p className="mt-1 text-sm text-red-700">{editing.error}</p>}
                      </div>
                      <Button type="submit" size="sm" loading={busy}>Enregistrer</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Annuler</Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{category.name}</p>
                        <p className="text-xs text-stone-500">{pluralize(category.books_count, 'livre')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setEditing({ id: category.id, name: category.name, error: null })} disabled={busy}>
                          Renommer
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={() => setToDelete(category)} disabled={busy}>
                          Supprimer
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- Ajout ---------- */}
        <aside>
          <form onSubmit={handleCreate} className="rounded-2xl border border-stone-200 bg-white p-5" noValidate>
            <h2 className="text-lg font-semibold">Nouvelle catégorie</h2>
            <label htmlFor="new-category" className="mt-3 block text-sm font-medium text-stone-800">Nom</label>
            <input
              id="new-category"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value)
                setNewError(null)
              }}
              placeholder="ex. Théâtre"
              aria-invalid={Boolean(newError)}
              aria-describedby={newError ? 'new-category-error' : undefined}
              className="mt-1.5 block w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:text-sm"
            />
            {newError && <p id="new-category-error" className="mt-1.5 text-sm text-red-700">{newError}</p>}
            <Button type="submit" className="mt-4 w-full" loading={busy}>Ajouter</Button>
          </form>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer cette catégorie ?"
        confirmLabel="Supprimer"
        danger
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete?.books_count > 0
          ? `« ${toDelete.name} » contient encore ${pluralize(toDelete.books_count, 'livre')} : la suppression sera refusée tant qu'ils n'auront pas changé de catégorie.`
          : `La catégorie « ${toDelete?.name} » sera supprimée.`}
      </ConfirmDialog>
    </>
  )
}
