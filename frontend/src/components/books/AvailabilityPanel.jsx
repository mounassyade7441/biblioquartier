import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { cancelReservation, reserveBook } from '../../api/member'
import { useAuth } from '../../hooks/useAuth'
import { formatDate, pluralize } from '../../utils/format'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { IconCheck, IconClock } from '../ui/Icons'

/**
 * Encadré "Disponibilité" de la fiche livre + l'action possible selon la personne :
 * - visiteur      : invitation à se connecter pour réserver
 * - adhérent      : Réserver / Annuler ma réservation / explication si impossible
 * - bibliothécaire: simple information
 *
 * Les règles (peut-il réserver ? pourquoi ?) viennent de l'API (bloc "viewer") :
 * l'interface ne fait qu'afficher la décision du serveur.
 */
export default function AvailabilityPanel({ book, viewer, onChanged, refreshing = false }) {
  const { user, isAdherent } = useAuth()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', text }

  async function run(action) {
    setBusy(true)
    setFeedback(null)
    try {
      const result = await action()
      setFeedback({ type: 'success', text: result.message })
      onChanged() // recharge la fiche (disponibilité, file d'attente…)
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setBusy(false)
      setConfirmCancel(false)
    }
  }

  const reservation = viewer?.reservation
  // Pendant l'action OU le rechargement de la fiche qui suit : boutons désactivés (pas de double clic)
  const locked = busy || refreshing
  const returnIsLate = Boolean(book.next_return_overdue) // calculé par le serveur

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="availability-title">
      <h2 id="availability-title" className="sr-only">
        Disponibilité
      </h2>

      {/* ---------- État du livre ---------- */}
      {book.is_available ? (
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
            <IconCheck className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-brand-800">Disponible</p>
            <p className="text-sm text-stone-600">
              {pluralize(book.available_copies, 'exemplaire')} sur {book.total_copies} en rayon. Venez l'emprunter à la
              bibliothèque.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-700">
            <IconClock className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-amber-900">Tous les exemplaires sont empruntés</p>
            <p className="text-sm text-stone-600">
              {book.next_return_at &&
                (returnIsLate ? (
                  <>Retour attendu depuis le {formatDate(book.next_return_at)}. </>
                ) : (
                  <>Retour prévu au plus tard le {formatDate(book.next_return_at)}. </>
                ))}
              {book.waiting_count > 0
                ? `${pluralize(book.waiting_count, 'personne')} en file d'attente.`
                : "Personne n'attend ce livre pour l'instant."}
            </p>
          </div>
        </div>
      )}

      {/* ---------- Action selon la personne ---------- */}
      <div className="mt-5 border-t border-stone-100 pt-5">
        {!user && !book.is_available && (
          <p className="text-sm text-stone-600">
            <Link to="/connexion" state={{ from: location.pathname }} className="font-medium text-brand-700 underline underline-offset-2">
              Connectez-vous
            </Link>{' '}
            pour réserver ce livre et être prévenu(e) dès son retour.
          </p>
        )}

        {!user && book.is_available && (
          <p className="text-sm text-stone-600">Les emprunts se font sur place, avec votre carte d'adhérent.</p>
        )}

        {user && !isAdherent && (
          <p className="text-sm text-stone-600">Vous êtes connecté(e) en tant que bibliothécaire.</p>
        )}

        {isAdherent && viewer && (
          <>
            {viewer.has_active_loan && (
              <p className="text-sm font-medium text-brand-800">Vous avez ce livre en ce moment. Bonne lecture !</p>
            )}

            {reservation?.status === 'en_attente' && (
              <div className="space-y-3">
                <p className="text-sm text-stone-700">
                  Vous avez réservé ce livre : vous êtes <strong>n° {reservation.position}</strong> dans la file d'attente.
                </p>
                <Button variant="secondary" disabled={locked} onClick={() => setConfirmCancel(true)}>
                  Annuler ma réservation
                </Button>
              </div>
            )}

            {reservation?.status === 'disponible' && (
              <div className="space-y-3">
                <Alert type="success" title="Ce livre vous attend !">
                  Il est mis de côté pour vous jusqu'au <strong>{formatDate(reservation.expires_at)}</strong>. Passé ce délai,
                  la réservation sera annulée.
                </Alert>
                <Button variant="secondary" disabled={locked} onClick={() => setConfirmCancel(true)}>
                  Je n'en ai plus besoin
                </Button>
              </div>
            )}

            {!reservation && !viewer.has_active_loan && viewer.can_reserve && (
              <div className="space-y-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  loading={locked}
                  onClick={() => run(() => reserveBook(book.id))}
                >
                  Réserver ce livre
                </Button>
                <p className="text-xs text-stone-500">
                  Vous serez n° {book.waiting_count + 1} dans la file d'attente. À son retour, le livre sera mis de côté
                  pour vous pendant 3 jours.
                </p>
              </div>
            )}

            {/* Réservation impossible : on affiche la raison donnée par l'API (sauf "disponible", déjà dit plus haut) */}
            {!reservation && !viewer.has_active_loan && !viewer.can_reserve && !book.is_available && (
              <Alert type="warning">{viewer.reserve_blocked_reason}</Alert>
            )}

            {!reservation && !viewer.has_active_loan && book.is_available && (
              <p className="text-sm text-stone-600">Présentez-vous à la bibliothèque pour l'emprunter.</p>
            )}
          </>
        )}

        {feedback && (
          <Alert type={feedback.type} className="mt-4">
            {feedback.text}
          </Alert>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Annuler votre réservation ?"
        confirmLabel="Oui, annuler"
        cancelLabel="Garder ma réservation"
        danger
        loading={busy}
        onConfirm={() => run(() => cancelReservation(reservation.id))}
        onCancel={() => setConfirmCancel(false)}
      >
        {reservation?.status === 'disponible'
          ? "Le livre sera proposé à la personne suivante dans la file d'attente."
          : "Vous perdrez votre place dans la file d'attente."}
      </ConfirmDialog>
    </section>
  )
}
