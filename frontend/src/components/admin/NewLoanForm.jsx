import { useState } from 'react'
import { createLoan, searchMembers } from '../../api/admin'
import { fetchBooks } from '../../api/catalog'
import { getErrorMessage } from '../../api/errors'
import AvailabilityBadge from '../books/AvailabilityBadge'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import SearchPicker from './SearchPicker'

/**
 * "Enregistrer un prêt" : un adhérent repart avec un livre.
 * Les informations affichées (retard, 3/3, disponibilité) aident le bibliothécaire,
 * mais c'est le SERVEUR qui applique les règles 1, 2, 3 et 6 et renvoie un message clair si besoin.
 */
export default function NewLoanForm({ onCreated, onClose }) {
  const [member, setMember] = useState(null)
  const [book, setBook] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await createLoan(member.id, book.id)
      setMember(null)
      setBook(null)
      onCreated(result.message)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Enregistrer un prêt</h2>
          <p className="text-sm text-stone-600">Durée : 3 semaines · 3 livres maximum par adhérent.</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-medium text-stone-500 hover:text-ink">
          Fermer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SearchPicker
          label="1. Adhérent"
          placeholder="Nom ou e-mail…"
          fetcher={(q) => searchMembers(q).then((r) => r.data)}
          selected={member}
          onSelect={setMember}
          renderItem={(m) => (
            <>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
                <span className="block truncate text-xs text-stone-500">{m.email}</span>
              </span>
              <MemberStatus member={m} />
            </>
          )}
          renderSelected={(m) => (
            <>
              <span className="block truncate text-sm font-medium text-ink">{m.name}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                {m.email} <MemberStatus member={m} />
              </span>
            </>
          )}
        />

        <SearchPicker
          label="2. Livre"
          placeholder="Titre ou auteur…"
          fetcher={(q) => fetchBooks({ search: q || undefined, per_page: 8 }).then((r) => r.data)}
          selected={book}
          onSelect={setBook}
          renderItem={(b) => (
            <>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{b.title}</span>
                <span className="block truncate text-xs text-stone-500">{b.author}</span>
              </span>
              <AvailabilityBadge book={b} className="shrink-0" />
            </>
          )}
          renderSelected={(b) => (
            <>
              <span className="block truncate text-sm font-medium text-ink">{b.title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                {b.author} <AvailabilityBadge book={b} />
              </span>
            </>
          )}
        />
      </div>

      {error && (
        <Alert type="error" className="mt-5" title="Prêt refusé">
          {error}
        </Alert>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="submit" size="lg" loading={busy} disabled={!member || !book} className="w-full sm:w-auto">
          Enregistrer le prêt
        </Button>
      </div>
    </form>
  )
}

/** Petites indications sur l'adhérent : nombre d'emprunts, retard. */
function MemberStatus({ member }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${member.active_loans_count >= 3 ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'}`}>
        {member.active_loans_count}/3
      </span>
      {member.has_overdue_loans && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">en retard</span>}
    </span>
  )
}
