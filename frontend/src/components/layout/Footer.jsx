export default function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:justify-between sm:px-6">
        <p>
          <span className="font-serif font-semibold text-stone-700">BiblioQuartier</span> — bibliothèque associative de quartier
        </p>
        <p>Prêt de 3 semaines · 3 livres maximum · 1 prolongation possible</p>
      </div>
    </footer>
  )
}
