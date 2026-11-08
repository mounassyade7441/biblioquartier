import { Link } from 'react-router'
import { formatDate } from '../../utils/format'
import BookCover from '../books/BookCover'
import Button from '../ui/Button'

/**
 * Une réservation active :
 * - "disponible" : le livre est mis de côté → date limite pour venir le chercher (règle 6)
 * - "en_attente" : place dans la file (règle 5)
 */
export default function ReservationCard({ reservation, onCancel, disabled }) {
  const ready = reservation.status === 'disponible'

  return (
    <article
      className={`flex gap-4 rounded-2xl border p-4 sm:p-5 ${
        ready ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200' : 'border-stone-200 bg-white'
      }`}
    >
      <Link to={`/livres/${reservation.book.id}`} className="w-14 shrink-0 sm:w-16" tabIndex={-1} aria-hidden="true">
        <BookCover book={reservation.book} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-serif text-lg font-semibold leading-snug">
          <Link to={`/livres/${reservation.book.id}`} className="hover:text-brand-700">
            {reservation.book.title}
          </Link>
        </h3>
        <p className="text-sm text-stone-600">{reservation.book.author}</p>

        {ready ? (
          <p className="mt-2 text-sm text-brand-900">
            <span className="font-semibold">Il vous attend à la bibliothèque</span> jusqu'au{' '}
            <strong>{formatDate(reservation.expires_at)}</strong>. Passé ce délai, la réservation sera annulée.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-700">
            Vous êtes <strong>n° {reservation.position}</strong> dans la file d'attente
            <span className="text-stone-500"> · réservé le {formatDate(reservation.created_at)}</span>
          </p>
        )}

        <div className="mt-3">
          <Button variant="ghost" size="sm" className="-ml-3 text-red-700 hover:bg-red-50" onClick={() => onCancel(reservation)} disabled={disabled}>
            Annuler la réservation
          </Button>
        </div>
      </div>
    </article>
  )
}
