import { useAuth } from '../../hooks/useAuth'

/**
 * Espace bibliothécaire (protégé : bibliothécaires uniquement).
 * Étape 11 : page d'accueil provisoire.
 * Étape 14 : tableau de bord, livres, catégories, prêts et retours.
 */
export default function AdminHomePage() {
  const { user } = useAuth()

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Administration</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bonjour {user.name.split(' ')[0]} !</h1>
      <p className="mt-2 text-stone-600">Le tableau de bord de la bibliothèque apparaîtra ici.</p>
    </section>
  )
}
