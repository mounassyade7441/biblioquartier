import { Link } from 'react-router'
import { fetchDashboard } from '../../api/admin'
import MonthlyLoansChart from '../../components/admin/MonthlyLoansChart'
import Alert from '../../components/ui/Alert'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../hooks/useAuth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { formatDate, formatShortDate, pluralize } from '../../utils/format'

/**
 * Tableau de bord du bibliothécaire.
 * Besoin du client : "voir en un coup d'œil les prêts en cours, les retards et les livres les plus empruntés".
 * Données : GET /api/admin/dashboard (un seul appel).
 */
export default function AdminHomePage() {
  useDocumentTitle('Tableau de bord')
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(fetchDashboard, [])

  if (loading && !data) return <Spinner label="Chargement du tableau de bord…" />
  if (error) {
    return (
      <Alert type="error" title="Le tableau de bord n'a pas pu être chargé" action={<Button variant="danger" size="sm" onClick={reload}>Réessayer</Button>}>
        {error}
      </Alert>
    )
  }

  const { stats } = data

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bonjour {user.name.split(' ')[0]} !</h1>
          <p className="mt-1 text-stone-600">Voici l'activité de la bibliothèque aujourd'hui.</p>
        </div>
        <Link to="/admin/prets?nouveau=1" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800">
          + Enregistrer un prêt
        </Link>
      </div>

      {/* ---------- Chiffres clés ---------- */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Prêts en cours" value={stats.active_loans} hint={`${stats.copies_out} exemplaires sur ${stats.total_copies} sortis`} />
        <StatTile
          label="En retard"
          value={stats.overdue_loans}
          hint={stats.overdue_loans > 0 ? `${pluralize(stats.members_with_overdue, 'adhérent')} bloqué(s)` : 'Aucun retard'}
          tone={stats.overdue_loans > 0 ? 'red' : 'neutral'}
        />
        <StatTile
          label="À mettre de côté"
          value={stats.ready_reservations}
          hint={`${pluralize(stats.waiting_reservations, 'réservation')} en attente`}
          tone={stats.ready_reservations > 0 ? 'green' : 'neutral'}
        />
        <StatTile label="Emprunts ce mois-ci" value={stats.loans_this_month} hint={`${stats.books} titres · ${stats.members} adhérents`} />
      </dl>

      {/* grid-cols-1 = minmax(0, 1fr) : la colonne peut rétrécir sous la largeur d'un texte tronqué
          (sinon un long titre sur une ligne élargit la page sur téléphone) */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------- Colonne principale ---------- */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel
            title="Retards"
            subtitle="Du plus ancien au plus récent"
            tone={data.overdue_loans.length > 0 ? 'red' : 'neutral'}
            action={<Link to="/admin/prets?statut=overdue" className="text-sm font-medium text-brand-700 hover:underline">Tout voir</Link>}
          >
            {data.overdue_loans.length === 0 ? (
              <Empty>Aucun livre en retard. 🎉</Empty>
            ) : (
              <ul className="divide-y divide-stone-100">
                {data.overdue_loans.map((loan) => (
                  <li key={loan.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{loan.user.name}</p>
                      <p className="truncate text-sm text-stone-600">« {loan.book.title} » · à rendre le {formatDate(loan.due_at)}</p>
                    </div>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                      {pluralize(loan.days_overdue, 'jour')} de retard
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="À rendre dans les 3 prochains jours">
            {data.due_soon.length === 0 ? (
              <Empty>Aucun retour attendu dans les 3 prochains jours.</Empty>
            ) : (
              <ul className="divide-y divide-stone-100">
                {data.due_soon.map((loan) => (
                  <li key={loan.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      <span className="font-medium text-ink">{loan.user.name}</span> · « {loan.book.title} »
                    </span>
                    <span className="text-stone-500">{formatShortDate(loan.due_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <MonthlyLoansChart months={data.monthly_loans} />
          </Panel>
        </div>

        {/* ---------- Colonne latérale ---------- */}
        <div className="min-w-0 space-y-6">
          <Panel title="Livres à mettre de côté" subtitle="Réservations à retirer sous 3 jours" tone={data.ready_reservations.length > 0 ? 'green' : 'neutral'}>
            {data.ready_reservations.length === 0 ? (
              <Empty>Aucun livre à mettre de côté.</Empty>
            ) : (
              <ul className="divide-y divide-stone-100">
                {data.ready_reservations.map((r) => (
                  <li key={r.id} className="py-3 text-sm">
                    <p className="font-medium text-ink">« {r.book.title} »</p>
                    <p className="text-stone-600">
                      pour {r.user.name} · jusqu'au {formatDate(r.expires_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Les plus empruntés">
            {data.top_books.length === 0 ? (
              <Empty>Pas encore d'emprunts.</Empty>
            ) : (
              <ol className="space-y-3">
                {data.top_books.map((book, i) => (
                  <li key={book.id} className="flex items-center gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 font-serif text-sm font-semibold text-stone-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/livres/${book.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                        {book.title}
                      </Link>
                      <p className="truncate text-xs text-stone-500">{book.author}</p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-stone-700">{pluralize(book.loans_count, 'prêt')}</span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

function StatTile({ label, value, hint, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-stone-200 bg-white',
    red: 'border-red-200 bg-red-50',
    green: 'border-brand-200 bg-brand-50',
  }
  const valueTones = { neutral: 'text-ink', red: 'text-red-700', green: 'text-brand-800' }
  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${tones[tone]}`}>
      <dt className="text-xs font-medium text-stone-600 sm:text-sm">{label}</dt>
      <dd className={`mt-1 font-serif text-3xl font-semibold tabular-nums ${valueTones[tone]}`}>{value}</dd>
      <dd className="mt-0.5 text-xs text-stone-500">{hint}</dd>
    </div>
  )
}

function Panel({ title, subtitle, action, tone = 'neutral', children }) {
  const border = { neutral: 'border-stone-200', red: 'border-red-200', green: 'border-brand-200' }[tone]
  return (
    <section className={`rounded-2xl border bg-white p-5 sm:p-6 ${border}`}>
      {title && (
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Empty({ children }) {
  return <p className="py-4 text-sm text-stone-500">{children}</p>
}
