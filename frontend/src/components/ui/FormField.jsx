import { useId } from 'react'

/**
 * Champ de formulaire accessible : libellé, champ, aide et message d'erreur.
 *
 *   <FormField label="Adresse e-mail" type="email" name="email" error={errors.email} … />
 *   <FormField as="textarea" label="Résumé" … />
 *   <FormField as="select" label="Catégorie" …><option …/></FormField>
 *
 * - le <label> est relié au champ (cliquer sur le libellé place le curseur dans le champ)
 * - aria-invalid + aria-describedby : les lecteurs d'écran annoncent l'erreur
 */
export default function FormField({ as = 'input', label, error, hint, className = '', children, ...inputProps }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const Control = as // 'input', 'textarea' ou 'select'

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-stone-800">
        {label}
        {inputProps.required && <span className="text-red-600" aria-hidden="true"> *</span>}
      </label>
      <Control
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-ink shadow-sm transition placeholder:text-stone-400 focus:outline-none focus:ring-2 sm:text-sm ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-stone-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...inputProps}
      >
        {children}
      </Control>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
