import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { getErrorMessage, getFieldErrors } from '../api/errors'
import AuthCard from '../components/auth/AuthCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { homePathFor } from '../context/AuthContext'
import { useAuth } from '../hooks/useAuth'

/** Comptes de démonstration créés par le seeder (affichés uniquement en développement). */
const DEMO_ACCOUNTS = [
  { email: 'biblio@biblioquartier.fr', label: 'Bibliothécaire' },
  { email: 'alice@exemple.fr', label: 'Alice — 2 emprunts' },
  { email: 'bruno@exemple.fr', label: 'Bruno — en retard' },
  { email: 'chloe@exemple.fr', label: 'Chloé — 3 emprunts' },
  { email: 'david@exemple.fr', label: 'David — livre mis de côté' },
  { email: 'emma@exemple.fr', label: "Emma — 1re dans la file" },
  { email: 'hugo@exemple.fr', label: 'Hugo — 2e dans la file' },
]

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Déjà connecté en arrivant sur la page ? Pas besoin de se reconnecter.
  // (!submitting : juste après une connexion réussie, c'est handleSubmit qui redirige
  //  vers la page demandée — on ne doit pas lui couper l'herbe sous le pied.)
  if (user && !submitting) {
    return <Navigate to={homePathFor(user)} replace />
  }

  // "Composant contrôlé" : la valeur de chaque champ est stockée dans l'état React
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault() // empêche le rechargement de la page par le navigateur
    setSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      const loggedUser = await login(form.email, form.password)
      // Retour à la page demandée avant la connexion, sinon l'accueil du rôle
      navigate(location.state?.from ?? homePathFor(loggedUser), { replace: true })
    } catch (err) {
      setFieldErrors(getFieldErrors(err))
      setError(getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Connexion"
      subtitle="Accédez à vos emprunts et à vos réservations."
      footer={
        <>
          Pas encore adhérent ?{' '}
          <Link to="/inscription" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      {location.state?.from && !error && (
        <Alert type="info" className="mb-5">
          Connectez-vous pour accéder à cette page.
        </Alert>
      )}

      {error && (
        <Alert type="error" className="mb-5">
          {error}
        </Alert>
      )}

      {/* noValidate : on laisse l'API valider pour avoir les messages en français */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update}
          error={fieldErrors.email && fieldErrors.email !== error ? fieldErrors.email : null}
        />
        <FormField
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={update}
          error={fieldErrors.password}
        />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Se connecter
        </Button>
      </form>

      {/* import.meta.env.DEV : vrai uniquement avec "npm run dev", jamais en production */}
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Comptes de démonstration · mot de passe « password »
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setForm({ email: account.email, password: 'password' })}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-300 hover:bg-brand-50 hover:text-brand-800 hover:ring-brand-200"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  )
}
