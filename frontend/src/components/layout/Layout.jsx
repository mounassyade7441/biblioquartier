import { Outlet } from 'react-router'
import Footer from './Footer'
import Navbar from './Navbar'

/**
 * Mise en page commune à toutes les pages.
 * <Outlet /> = l'emplacement où React Router affiche la page en cours.
 */
export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      {/* Lien d'évitement : permet aux utilisateurs clavier de sauter directement au contenu */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>

      <Navbar />

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
