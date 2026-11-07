/**
 * Pastille de disponibilité d'un livre.
 * La couleur n'est jamais la seule information : le texte dit aussi l'état
 * (important pour les personnes daltoniennes).
 */
export default function AvailabilityBadge({ book, className = '' }) {
  if (book.is_available) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800 ring-1 ring-brand-200 ${className}`}>
        <span className="size-1.5 rounded-full bg-brand-500" />
        Disponible
        <span className="text-brand-600/80">· {book.available_copies} ex.</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ${className}`}>
      <span className="size-1.5 rounded-full bg-amber-500" />
      Emprunté
      {book.waiting_count > 0 && <span className="text-amber-700/80">· {book.waiting_count} en attente</span>}
    </span>
  )
}
