import { useEffect, useRef } from 'react'
import Button from './Button'

/**
 * Fenêtre de confirmation, basée sur l'élément HTML natif <dialog> :
 * le navigateur gère pour nous le fond grisé, la touche Échap et le focus clavier.
 *
 *   <ConfirmDialog open={open} title="Annuler la réservation ?" onConfirm={…} onCancel={…}>
 *     Vous perdrez votre place dans la file d'attente.
 *   </ConfirmDialog>
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Retour',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null)

  // Synchronise l'état React (open) avec le <dialog> du navigateur
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault() // touche Échap : on laisse React fermer
        onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 shadow-xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {children && <div className="mt-2 text-sm leading-relaxed text-stone-600">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
