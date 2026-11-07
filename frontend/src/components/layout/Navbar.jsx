import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { IconBook, IconClose, IconMenu } from '../ui/Icons'

/** Liens de navigation. Les espaces adhérent / bibliothécaire seront ajoutés à l'étape 11. */
const LINKS = [{ to: '/', label: 'Catalogue', end: true }]

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

/**
 * Barre de navigation responsive :
 * - ordinateur : liens alignés horizontalement
 * - téléphone : bouton "menu" qui ouvre un panneau vertical
 */
export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Navigation principale">
        <Logo />

        {/* Ordinateur */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Téléphone : bouton menu */}
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

      {/* Téléphone : panneau du menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-stone-200 bg-paper px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              // Un clic sur un lien referme le menu
              <NavLink key={link.to} to={link.to} end={link.end} className={navClass} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
