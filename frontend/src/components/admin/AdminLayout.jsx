import { NavLink, Outlet } from 'react-router'

const SECTIONS = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/prets', label: 'Prêts & retours' },
  { to: '/admin/livres', label: 'Livres' },
  { to: '/admin/categories', label: 'Catégories' },
]

/**
 * Mise en page de l'espace bibliothécaire : sous-menu commun + page en cours (<Outlet />).
 * Sur téléphone, le sous-menu défile horizontalement.
 */
export default function AdminLayout() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Administration</p>
        <nav
          aria-label="Administration"
          className="-mx-4 mt-3 overflow-x-auto border-b border-stone-200 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
        >
          <div className="flex w-max gap-1">
            {SECTIONS.map((s) => (
              <NavLink
                key={s.to}
                to={s.to}
                end={s.end}
                className={({ isActive }) =>
                  `-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition sm:px-4 ${
                    isActive ? 'border-brand-700 text-brand-800' : 'border-transparent text-stone-500 hover:text-ink'
                  }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      <Outlet />
    </>
  )
}
