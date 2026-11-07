import { IconBook } from '../ui/Icons'

/** Cadre commun aux pages de connexion et d'inscription. */
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-700 text-paper">
          <IconBook className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-stone-600">{subtitle}</p>}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">{children}</div>

      {footer && <div className="mt-6 text-center text-sm text-stone-600">{footer}</div>}
    </div>
  )
}
