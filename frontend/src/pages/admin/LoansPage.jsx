import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { fetchLoans, returnLoan } from '../../api/admin'
import { getErrorMessage } from '../../api/errors'
import NewLoanForm from '../../components/admin/NewLoanForm'
import LoanStatusBadge from '../../components/member/LoanStatusBadge'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { IconSearch } from '../../components/ui/Icons'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDate, pluralize } from '../../utils/format'

const FILTERS = [
  { id: 'active', label: 'En cours' },
  { id: 'overdue', label: 'En retard' },
  { id: 'returned', label: 'Rendus' },
  { id: 'all', label: 'Tous' },
]

/**
 * Prêts & retours (bibliothécaire) :
 * - enregistrer un prêt (formulaire en haut)
 * - lister / filtrer / rechercher les prêts
 * - enregistrer un retour (bouton sur chaque prêt en cours) → règle 6 : "à mettre de côté pour…"
 */
export default function LoansPage() {
  useDocumentTitle('Prêts & retours')
  const [params, setParams] = useSearchParams()
  const status = FILTERS.some((f) => f.id === params.get('statut')) ? params.get('statut') : 'active'
  const [showForm, setShowForm] = useState(params.get('nouveau') === '1')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query.trim(), 300)

  const loans = useAsync(() => fetchLoans({ status, search, page }), [status, search, page])

  const [toReturn, setToReturn] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  function changeFilter(id) {
    setPage(1)
    setParams(id === 'active' ? {} : { statut: id }, { replace: true })
  }

  async function confirmReturn() {
    setBusy(true)
    try {
      const result = await returnLoan(toReturn.id)
      // Règle 6 : si le livre est réservé, le message le dit et on le met en avant
      setNotice({ type: result.held_for ? 'warning' : 'success', title: result.held_for ? 'À mettre de côté !' : null, text: result.message })
      loans.reload()
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusy(false)
      setToReturn(null)
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Prêts & retours</h1>
        {!showForm && <Button onClick={() => setShowForm(true)}>+ Enregistrer un prêt</Button>}
      </div>

      {showForm && (
        <div className="mb-8">
          <NewLoanForm
            onClose={() => setShowForm(false)}
            onCreated={(message) => {
              setNotice({ type: 'success', text: message })
              loans.reload()
            }}
          />
        </div>
      )}

      {notice && (
        <Alert type={notice.type} title={notice.title} className="mb-5" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {/* ---------- Filtres ---------- */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les prêts">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => changeFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                status === f.id ? 'bg-brand-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-brand-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <label htmlFor="loan-search" className="sr-only">Rechercher un adhérent ou un livre</label>
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            id="loan-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Adhérent ou titre…"
            className="block w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:text-sm"
          />
        </div>
      </div>

      {/* ---------- Liste ---------- */}
      {loans.loading && !loans.data && <Spinner label="Chargement des prêts…" />}
      {loans.error && <Alert type="error" action={<Button variant="danger" size="sm" onClick={loans.reload}>Réessayer</Button>}>{loans.error}</Alert>}

      {loans.data && (
        <div className={loans.loading ? 'opacity-60 transition-opacity' : ''}>
          <p className="mb-3 text-sm text-stone-600" aria-live="polite">
            {pluralize(loans.data.meta.total, 'prêt')}
          </p>

          {loans.data.data.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-stone-600">Aucun prêt ne correspond.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="hidden bg-stone-50 text-xs uppercase tracking-wider text-stone-500 md:table-header-group">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Adhérent</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Livre</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Emprunté le</th>
                    <th scope="col" className="px-5 py-3 font-semibold">État</th>
                    <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loans.data.data.map((loan) => (
                    <tr key={loan.id} className={`block p-4 md:table-row md:p-0 ${loan.status === 'en_retard' ? 'bg-red-50/50' : ''}`}>
                      <td className="block md:table-cell md:px-5 md:py-3.5">
                        <span className="font-medium text-ink">{loan.user.name}</span>
                        <span className="block text-xs text-stone-500">{loan.user.email}</span>
                      </td>
                      <td className="mt-2 block md:mt-0 md:table-cell md:px-5 md:py-3.5">
                        <span className="text-ink">« {loan.book.title} »</span>
                      </td>
                      <td className="mt-1 block text-stone-600 md:mt-0 md:table-cell md:px-5 md:py-3.5">
                        <span className="md:hidden">Emprunté le </span>
                        {formatDate(loan.borrowed_at)}
                      </td>
                      <td className="mt-2 block md:mt-0 md:table-cell md:px-5 md:py-3.5">
                        <LoanStatusBadge loan={loan} />
                        {loan.status !== 'rendu' && <span className="mt-1 block text-xs text-stone-500">avant le {formatDate(loan.due_at)}</span>}
                      </td>
                      <td className="mt-3 block md:mt-0 md:table-cell md:px-5 md:py-3.5 md:text-right">
                        {loan.status !== 'rendu' && (
                          <Button variant="secondary" size="sm" onClick={() => setToReturn(loan)} disabled={busy}>
                            Enregistrer le retour
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={loans.data.meta.current_page} lastPage={loans.data.meta.last_page} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toReturn)}
        title="Enregistrer le retour ?"
        confirmLabel="Oui, le livre est rendu"
        loading={busy}
        onConfirm={confirmReturn}
        onCancel={() => setToReturn(null)}
      >
        {toReturn && (
          <>
            {toReturn.user.name} rapporte « {toReturn.book.title} ».
            {toReturn.status === 'en_retard' && ` (avec ${pluralize(toReturn.days_overdue, 'jour')} de retard)`}
          </>
        )}
      </ConfirmDialog>
    </>
  )
}
