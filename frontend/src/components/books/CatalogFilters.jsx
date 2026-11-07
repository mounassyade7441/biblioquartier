import { IconClose, IconSearch } from '../ui/Icons'

const SORT_OPTIONS = [
  { value: 'title', label: 'Titre (A → Z)' },
  { value: 'author', label: 'Auteur (A → Z)' },
  { value: 'recent', label: 'Nouveautés' },
  { value: 'popular', label: 'Les plus empruntés' },
]

/**
 * Barre de recherche et filtres du catalogue.
 * Composant "présentation" : il n'appelle pas l'API, il affiche des valeurs
 * et prévient la page parente quand l'utilisateur change quelque chose.
 */
export default function CatalogFilters({
  query,
  onQueryChange,
  categories,
  category,
  onCategoryChange,
  availableOnly,
  onAvailableOnlyChange,
  sort,
  onSortChange,
}) {
  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <label htmlFor="catalog-search" className="sr-only">
          Rechercher un livre par titre ou par auteur
        </label>
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Rechercher un titre ou un auteur…"
          autoComplete="off"
          className="block w-full rounded-xl border border-stone-300 bg-white py-3.5 pl-12 pr-12 text-base shadow-sm placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-500 hover:bg-stone-100"
            aria-label="Effacer la recherche"
          >
            <IconClose className="size-4" />
          </button>
        )}
      </div>

      {/* Catégories : défilement horizontal sur téléphone (sans faire déborder la page) */}
      <div
        className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Filtrer par catégorie"
      >
        <div className="flex w-max gap-2 pb-1 sm:w-auto sm:flex-wrap">
          <CategoryChip active={!category} onClick={() => onCategoryChange(null)}>
            Toutes
          </CategoryChip>
          {categories.map((cat) => (
            <CategoryChip key={cat.id} active={category === cat.slug} onClick={() => onCategoryChange(cat.slug)}>
              {cat.name}
              <span className={category === cat.slug ? 'text-white/70' : 'text-stone-400'}>{cat.books_count}</span>
            </CategoryChip>
          ))}
        </div>
      </div>

      {/* Disponibles + tri */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => onAvailableOnlyChange(e.target.checked)}
            className="size-4 rounded border-stone-300 accent-brand-700"
          />
          Seulement les livres disponibles
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-stone-600">
          Trier par
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white py-1.5 pl-3 pr-8 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function CategoryChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-brand-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-300 hover:bg-brand-50 hover:ring-brand-200'
      }`}
    >
      {children}
    </button>
  )
}
