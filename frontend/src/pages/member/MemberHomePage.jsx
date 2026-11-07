import { useLocation } from 'react-router'
import Alert from '../../components/ui/Alert'
import { useAuth } from '../../hooks/useAuth'

/**
 * Espace adhérent (protégé : adhérents uniquement).
 * Étape 11 : page d'accueil provisoire.
 * Étape 13 : emprunts en cours, alertes de retard, prolongation, réservations, historique.
 */
export default function MemberHomePage() {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <section>
      {location.state?.flash && (
        <Alert type="success" className="mb-6">
          {location.state.flash}
        </Alert>
      )}
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Mon espace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bonjour {user.name.split(' ')[0]} !</h1>
      <p className="mt-2 text-stone-600">Vos emprunts et vos réservations apparaîtront ici.</p>
    </section>
  )
}
