import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import {
  cancelReservation,
  extendLoan,
  fetchActiveLoans,
  fetchLoanHistory,
  fetchMyReservations,
  fetchSummary,
} from '../../api/member'
import HistoryList from '../../components/member/HistoryList'
import LoanCard from '../../components/member/LoanCard'
import ReservationCard from '../../components/member/ReservationCard'
import SummaryCards from '../../components/member/SummaryCards'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../hooks/useAuth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDate, pluralize } from '../../utils/format'

// short : libellé court affiché sur téléphone (les 3 onglets tiennent sur la largeur)
const TABS = [
  { id: 'emprunts', label: 'Emprunts en cours', short: 'Emprunts' },
  { id: 'reservations', label: 'Réservations', short: 'Réservations' },
  { id: 'historique', label: 'Historique', short: 'Historique' },
]

/**
 * Espace adhérent :
 * - emprunts en cours + date de retour + alerte de retard + prolongation (règle 4)
 * - réservations (place dans la file, livre mis de côté) + annulation
 * - historique des anciens emprunts
 */
export default function MemberHomePage() {
  useDocumentTitle('Mon espace')
  const { user } = useAuth()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('onglet')) ? params.get('onglet') : 'emprunts'
  const [historyPage, setHistoryPage] = useState(1)

  // Données (chaque bloc se charge indépendamment)
  const summary = useAsync(fetchSummary, [])
  const loans = useAsync(fetchActiveLoans, [])
  const reservations = useAsync(fetchMyReservations, [])
  const history = useAsync(() => (tab === 'historique' ? fetchLoanHistory(historyPage) : Promise.resolve(null)), [tab, historyPage])

  // Action en cours : { type: 'extend', loan } ou { type: 'cancel', reservation }
  const [pending, setPending] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(location.state?.flash ? { type: 'success', text: location.state.flash } : null)

  async function confirmPending() {
    setBusy(true)
    try {
      const result =
        pending.type === 'extend' ? await extendLoan(pending.loan.id) : await cancelReservation(pending.reservation.id)
      setNotice({ type: 'success', text: result.message })
      // On recharge ce qui a pu changer
      summary.reload()
      loans.reload()
      reservations.reload()
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusy(false)
      setPending(null)
    }
  }

  const overdueLoans = loans.data?.filter((l) => l.status === 'en_retard') ?? []
  const readyReservations = reservations.data?.filter((r) => r.status === 'disponible') ?? []
  const counts = {
    emprunts: loans.data?.length,
    reservations: reservations.data?.length,
  }

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Mon espace</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Bonjour {user.name.split(' ')[0]} !</h1>
      </header>

      {notice && (
        <Alert type={notice.type} className="mb-5" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {/* ---------- Avertissement visuel : retard (règle 3) ---------- */}
      {overdueLoans.length > 0 && (
        <Alert type="error" className="mb-5" title={`Vous avez ${pluralize(overdueLoans.length, 'livre')} en retard`}>
          Merci de {overdueLoans.length > 1 ? 'les' : 'le'} rapporter au plus vite :{' '}
          <strong>{overdueLoans.map((l) => `« ${l.book.title} »`).join(', ')}</strong>. Tant que{' '}
          {overdueLoans.length > 1 ? 'ces livres ne sont pas rendus' : "ce livre n'est pas rendu"}, vous ne pouvez plus emprunter ni
          réserver.
        </Alert>
      )}

      {/* ---------- Livre mis de côté (règle 6) ---------- */}
      {readyReservations.length > 0 && (
        <Alert type="success" className="mb-5" title={readyReservations.length > 1 ? 'Des livres vous attendent !' : 'Un livre vous attend !'}>
          {readyReservations.map((r) => (
            <span key={r.id} className="block">
              « {r.book.title} » est mis de côté pour vous jusqu'au <strong>{formatDate(r.expires_at)}</strong>.
            </span>
          ))}
        </Alert>
      )}

      {summary.data && (
        <div className="mb-8">
          <SummaryCards summary={summary.data} />
        </div>
      )}

      {/* ---------- Onglets ---------- */}
      <div role="tablist" aria-label="Mon espace" className="mb-6 flex gap-1 overflow-x-auto border-b border-stone-200 [scrollbar-width:none]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setParams(t.id === 'emprunts' ? {} : { onglet: t.id }, { replace: true })}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
              tab === t.id ? 'border-brand-700 text-brand-800' : 'border-transparent text-stone-500 hover:text-ink'
            }`}
          >
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {counts[t.id] !== undefined && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs sm:ml-2 sm:px-2 ${tab === t.id ? 'bg-brand-100' : 'bg-stone-100'}`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'emprunts' && (
          <TabContent state={loans} emptyTitle="Aucun emprunt en cours" emptyText="Trouvez votre prochaine lecture dans le catalogue, puis empruntez-la à la bibliothèque.">
            {(list) => (
              <div className="space-y-4">
                {list.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} disabled={busy} onExtend={(l) => setPending({ type: 'extend', loan: l })} />
                ))}
              </div>
            )}
          </TabContent>
        )}

        {tab === 'reservations' && (
          <TabContent state={reservations} emptyTitle="Aucune réservation" emptyText="Quand un livre est emprunté par quelqu'un d'autre, réservez-le depuis sa fiche.">
            {(list) => (
              <div className="space-y-4">
                {list.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    disabled={busy}
                    onCancel={(r) => setPending({ type: 'cancel', reservation: r })}
                  />
                ))}
              </div>
            )}
          </TabContent>
        )}

        {tab === 'historique' && (
          <TabContent state={history} list={history.data?.data} emptyTitle="Pas encore d'historique" emptyText="Les livres que vous aurez rendus apparaîtront ici.">
            {(list) => (
              <>
                <HistoryList loans={list} />
                <Pagination currentPage={history.data.meta.current_page} lastPage={history.data.meta.last_page} onChange={setHistoryPage} />
              </>
            )}
          </TabContent>
        )}
      </section>

      {/* ---------- Confirmations ---------- */}
      <ConfirmDialog
        open={pending?.type === 'extend'}
        title="Prolonger cet emprunt ?"
        confirmLabel="Prolonger d'une semaine"
        loading={busy}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      >
        « {pending?.loan?.book.title} » sera à rendre une semaine plus tard. Attention : chaque emprunt ne peut être prolongé qu'une
        seule fois.
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.type === 'cancel'}
        title="Annuler cette réservation ?"
        confirmLabel="Oui, annuler"
        cancelLabel="Garder ma réservation"
        danger
        loading={busy}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      >
        {pending?.reservation?.status === 'disponible'
          ? `« ${pending.reservation.book.title} » sera proposé à la personne suivante dans la file d'attente.`
          : `Vous perdrez votre place dans la file d'attente pour « ${pending?.reservation?.book.title} ».`}
      </ConfirmDialog>
    </>
  )
}

/** Gère les 4 états d'un onglet : chargement, erreur, vide, liste. */
function TabContent({ state, list = state.data, emptyTitle, emptyText, children }) {
  if (state.loading && !list) return <Spinner />
  if (state.error) {
    return (
      <Alert
        type="error"
        action={
          <Button variant="danger" size="sm" onClick={state.reload}>
            Réessayer
          </Button>
        }
      >
        {state.error}
      </Alert>
    )
  }
  if (!list) return null
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center">
        <p className="font-serif text-xl font-semibold">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone-600">{emptyText}</p>
        <Link to="/" className="mt-5 inline-flex rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800">
          Parcourir le catalogue
        </Link>
      </div>
    )
  }
  return <div className={state.loading ? 'opacity-60 transition-opacity' : ''}>{children(list)}</div>
}
