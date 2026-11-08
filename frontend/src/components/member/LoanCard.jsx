import { Link } from 'react-router'
import { formatDate } from '../../utils/format'
import BookCover from '../books/BookCover'
import Button from '../ui/Button'
import LoanStatusBadge from './LoanStatusBadge'

/**
 * Un emprunt en cours.
 * - En retard : carte bordée de rouge (avertissement visuel demandé par le client)
 * - Prolongation : bouton actif si l'API dit can_extend, sinon on affiche la raison (règle 4)
 */
export default function LoanCard({ loan, onExtend, disabled }) {
  const overdue = loan.status === 'en_retard'

  return (
    <article
      className={`flex gap-4 rounded-2xl border p-4 sm:p-5 ${
        overdue ? 'border-red-300 bg-red-50/60 ring-1 ring-red-200' : 'border-stone-200 bg-white'
      }`}
    >
      <Link to={`/livres/${loan.book.id}`} className="w-16 shrink-0 sm:w-20" tabIndex={-1} aria-hidden="true">
        <BookCover book={loan.book} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-lg font-semibold leading-snug">
              <Link to={`/livres/${loan.book.id}`} className="hover:text-brand-700">
                {loan.book.title}
              </Link>
            </h3>
            <p className="text-sm text-stone-600">{loan.book.author}</p>
          </div>
          <LoanStatusBadge loan={loan} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:flex sm:gap-x-8">
          <div>
            <dt className="text-xs text-stone-500">Emprunté le</dt>
            <dd>{formatDate(loan.borrowed_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">À rendre avant le</dt>
            <dd className={`font-semibold ${overdue ? 'text-red-700' : 'text-ink'}`}>
              {formatDate(loan.due_at)}
              {loan.extended && <span className="ml-1.5 text-xs font-normal text-stone-500">(prolongé)</span>}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {loan.can_extend ? (
            <Button variant="secondary" size="sm" onClick={() => onExtend(loan)} disabled={disabled}>
              Prolonger d'une semaine
            </Button>
          ) : (
            <p className="text-xs text-stone-500">
              <span className="font-medium text-stone-600">Prolongation impossible : </span>
              {loan.extend_blocked_reason}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
