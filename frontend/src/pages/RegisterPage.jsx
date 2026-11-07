import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { getErrorMessage, getFieldErrors } from '../api/errors'
import AuthCard from '../components/auth/AuthCard'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import { homePathFor } from '../context/AuthContext'
import { useAuth } from '../hooks/useAuth'

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', password_confirmation: '' }

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Déjà connecté en arrivant ? (!submitting : voir LoginPage)
  if (user && !submitting) {
    return <Navigate to={homePathFor(user)} replace />
  }

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})

    // Vérification immédiate côté navigateur (confort) — l'API revérifie de toute façon
    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Les deux mots de passe ne sont pas identiques.' })
      return
    }

    setSubmitting(true)
    try {
      await register(form)
      navigate('/mon-espace', {
        replace: true,
        state: { flash: 'Bienvenue ! Votre compte adhérent a été créé.' },
      })
    } catch (err) {
      const fields = getFieldErrors(err)
      setFieldErrors(fields)
      // Message général seulement si l'erreur n'est pas déjà affichée sous un champ
      setError(Object.keys(fields).length ? 'Merci de corriger les champs indiqués.' : getErrorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthCard
      title="Devenir adhérent"
      subtitle="Créez votre compte pour réserver des livres et suivre vos emprunts."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-medium text-brand-700 underline-offset-2 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      {error && (
        <Alert type="error" className="mb-5">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Nom complet" name="name" autoComplete="name" required value={form.name} onChange={update} error={fieldErrors.name} />
        <FormField
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update}
          error={fieldErrors.email}
        />
        <FormField
          label="Téléphone"
          type="tel"
          name="phone"
          autoComplete="tel"
          value={form.phone}
          onChange={update}
          error={fieldErrors.phone}
          hint="Facultatif — pour vous prévenir quand un livre réservé est disponible."
        />
        <FormField
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update}
          error={fieldErrors.password}
          hint="8 caractères minimum."
        />
        <FormField
          label="Confirmer le mot de passe"
          type="password"
          name="password_confirmation"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={update}
          error={fieldErrors.password_confirmation}
        />
        <Button type="submit" loading={submitting} className="w-full" size="lg">
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  )
}
