import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'
import { IconBook, IconClose, IconMenu } from '../ui/Icons'

function navClass({ isActive }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-800' : 'text-stone-600 hover:bg-stone-100 hover:text-ink'
  }`
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="BiblioQuartier, retour au catalogue">
      <span className="grid size-9 place-items-center rounded-lg bg-brand-700 text-paper">
        <IconBook className="size-5" />
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight text-ink">
        Biblio<span className="text-brand-700">Quartier</span>
      </span>
    </Link>
  )
}

/** Les liens dépendent de qui est connecté : visiteur, adhérent ou bibliothécaire. */
function linksFor({ isAdherent, isLibrarian }) {
  const links = [{ to: '/', label: 'Catalogue', end: true }]
  if (isAdherent) links.push({ to: '/mon-espace', label: 'Mon espace' })
  if (isLibrarian) links.push({ to: '/admin', label: 'Administration' })
  return links
}

/** Initiales pour l'avatar : "Alice Martin" → "AM" */
function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

/**
 * Barre de navigation responsive :
 * - ordinateur : liens alignés horizontalement
 * - téléphone : bouton "menu" qui ouvre un panneau vertical
 */
export default function Navbar() {
  const auth = useAuth()
  const { user, logout } = auth
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const links = linksFor(auth)

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/') // retour au catalogue (si on était sur une page protégée, RequireAuth fait de même)
  }

  const close = () => setOpen(false)

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Navigation principale">
        <Logo />

        {/* ---------- Ordinateur ---------- */}
        <div className="hidden flex-1 items-center justify-between md:flex">
          <div className="ml-6 flex items-center gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-stone-700">
                <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800" aria-hidden="true">
                  {initials(user.name)}
                </span>
                <span className="max-w-40 truncate font-medium">{user.name}</span>
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink to="/connexion" className={navClass}>
                Se connecter
              </NavLink>
              <Link to="/inscription" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
                Devenir adhérent
              </Link>
            </div>
          )}
        </div>

        {/* ---------- Téléphone : bouton menu ---------- */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 place-items-center rounded-lg text-stone-700 hover:bg-stone-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <IconClose className="size-6" /> : <IconMenu className="size-6" />}
        </button>
      </nav>

      {/* ---------- Téléphone : panneau du menu ---------- */}
      {open && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-paper px-4 pb-5 pt-2 md:hidden">
          {user && (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-stone-700">
              <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800" aria-hidden="true">
                {initials(user.name)}
              </span>
              Connecté(e) : <span className="font-medium">{user.name}</span>
            </p>
          )}
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass} onClick={close}>
                {link.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 border-t border-stone-200 pt-4">
            {user ? (
              <Button variant="secondary" className="w-full" onClick={handleLogout}>
                Déconnexion
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/connexion" onClick={close} className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-stone-700 ring-1 ring-stone-300">
                  Se connecter
                </Link>
                <Link to="/inscription" onClick={close} className="rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-medium text-white">
                  Devenir adhérent
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
