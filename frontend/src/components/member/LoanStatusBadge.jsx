import { formatDate, pluralize } from '../../utils/format'

/**
 * Pastille d'état d'un emprunt — calculée par l'API (status, days_left, days_overdue).
 * Rouge = en retard, ambre = à rendre bientôt (3 jours ou moins), vert = tranquille.
 * Le texte dit toujours l'état : la couleur n'est jamais la seule information.
 */
export default function LoanStatusBadge({ loan }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1'

  if (loan.status === 'rendu') {
    return <span className={`${base} bg-stone-100 text-stone-700 ring-stone-200`}>Rendu le {formatDate(loan.returned_at)}</span>
  }

  if (loan.status === 'en_retard') {
    return (
      <span className={`${base} bg-red-100 text-red-800 ring-red-200`}>
        <span className="size-1.5 rounded-full bg-red-600" />
        En retard de {pluralize(loan.days_overdue, 'jour')}
      </span>
    )
  }

  if (loan.days_left === 0) {
    return (
      <span className={`${base} bg-amber-100 text-amber-900 ring-amber-200`}>
        <span className="size-1.5 rounded-full bg-amber-500" />À rendre aujourd'hui
      </span>
    )
  }

  const soon = loan.days_left <= 3
  return (
    <span className={`${base} ${soon ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-brand-50 text-brand-800 ring-brand-200'}`}>
      <span className={`size-1.5 rounded-full ${soon ? 'bg-amber-500' : 'bg-brand-500'}`} />À rendre dans {pluralize(loan.days_left, 'jour')}
    </span>
  )
}
