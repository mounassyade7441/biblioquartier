/** Indicateur de chargement, annoncé aux lecteurs d'écran grâce à role="status". */
export default function Spinner({ label = 'Chargement…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-12 text-stone-500 ${className}`}>
      <span className="size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
