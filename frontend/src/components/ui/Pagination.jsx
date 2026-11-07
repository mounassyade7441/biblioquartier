/**
 * Pagination : « ‹ Précédent  1 2 3 … 8  Suivant › »
 * Sur téléphone, seuls Précédent / « Page 2 sur 8 » / Suivant sont affichés.
 */

/** Numéros à afficher : 1 … 4 5 6 … 10 (null = "…") */
function pageWindow(current, last) {
  const pages = new Set([1, last, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)

  const result = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) result.push(null)
    result.push(page)
  })
  return result
}

export default function Pagination({ currentPage, lastPage, onChange }) {
  if (lastPage <= 1) return null

  const button = 'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition'

  return (
    <nav className="mt-10 flex items-center justify-between gap-2 border-t border-stone-200 pt-6" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`${button} text-stone-700 ring-1 ring-stone-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40`}
      >
        ‹ Précédent
      </button>

      <p className="text-sm text-stone-600 sm:hidden">
        Page {currentPage} sur {lastPage}
      </p>

      <div className="hidden items-center gap-1 sm:flex">
        {pageWindow(currentPage, lastPage).map((page, i) =>
          page === null ? (
            <span key={`gap-${i}`} className="px-1 text-stone-400">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
              className={`${button} ${page === currentPage ? 'bg-brand-700 text-white' : 'text-stone-700 hover:bg-white'}`}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
        className={`${button} text-stone-700 ring-1 ring-stone-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Suivant ›
      </button>
    </nav>
  )
}
