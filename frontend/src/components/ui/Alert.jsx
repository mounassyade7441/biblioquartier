import { IconAlert, IconCheck, IconClose, IconInfo } from './Icons'

const STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: IconAlert, iconColor: 'text-red-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-950', icon: IconAlert, iconColor: 'text-amber-600' },
  success: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: IconCheck, iconColor: 'text-brand-600' },
  info: { box: 'border-sky-200 bg-sky-50 text-sky-950', icon: IconInfo, iconColor: 'text-sky-600' },
}

/**
 * Message mis en évidence.
 * <Alert type="error" title="Oups">Impossible de joindre le serveur.</Alert>
 * Les erreurs utilisent role="alert" : elles sont lues immédiatement par les lecteurs d'écran.
 */
export default function Alert({ type = 'info', title, children, action, onDismiss, className = '' }) {
  const style = STYLES[type]
  const Icon = style.icon

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-xl border p-4 ${style.box} ${className}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${style.iconColor}`} />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 grid size-7 shrink-0 place-items-center rounded-md opacity-60 hover:bg-black/5 hover:opacity-100"
          aria-label="Fermer le message"
        >
          <IconClose className="size-4" />
        </button>
      )}
    </div>
  )
}
