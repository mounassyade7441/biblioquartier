import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <p className="font-serif text-6xl font-semibold text-brand-700">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Cette page est introuvable</h1>
      <p className="mt-2 text-stone-600">Elle a peut-être été déplacée, ou l'adresse contient une faute de frappe.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800"
      >
        Retour au catalogue
      </Link>
    </section>
  )
}
