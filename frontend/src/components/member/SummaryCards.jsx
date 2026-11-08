/**
 * Les chiffres clés de l'adhérent, en haut de son espace.
 * Données : GET /api/my/summary
 */
export default function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Emprunts en cours',
      value: `${summary.active_loans_count} / ${summary.max_loans}`,
      hint: summary.active_loans_count >= summary.max_loans ? 'Maximum atteint' : `Encore ${summary.max_loans - summary.active_loans_count} possible(s)`,
      tone: summary.active_loans_count >= summary.max_loans ? 'amber' : 'neutral',
    },
    {
      label: 'En retard',
      value: summary.overdue_count,
      hint: summary.overdue_count > 0 ? 'À rapporter au plus vite' : 'Aucun retard, bravo !',
      tone: summary.overdue_count > 0 ? 'red' : 'neutral',
    },
    {
      label: 'Livres qui vous attendent',
      value: summary.ready_reservations_count,
      hint: summary.ready_reservations_count > 0 ? 'À venir chercher sous 3 jours' : 'Aucun pour le moment',
      tone: summary.ready_reservations_count > 0 ? 'green' : 'neutral',
    },
    {
      label: "En file d'attente",
      value: summary.waiting_reservations_count,
      hint: 'Réservations en attente',
      tone: 'neutral',
    },
  ]

  const tones = {
    neutral: 'border-stone-200 bg-white',
    red: 'border-red-200 bg-red-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-brand-200 bg-brand-50',
  }
  const valueTones = { neutral: 'text-ink', red: 'text-red-700', amber: 'text-amber-800', green: 'text-brand-800' }

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-4 ${tones[card.tone]}`}>
          <dt className="text-xs font-medium text-stone-600">{card.label}</dt>
          <dd className={`mt-1 font-serif text-2xl font-semibold ${valueTones[card.tone]}`}>{card.value}</dd>
          <dd className="mt-0.5 text-xs text-stone-500">{card.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
