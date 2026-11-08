import { useId, useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { IconSearch } from '../ui/Icons'

/**
 * Champ "rechercher puis choisir" (un adhérent, un livre…).
 *
 *   <SearchPicker label="Adhérent" fetcher={(q) => searchMembers(q).then(r => r.data)}
 *                 renderItem={(m) => …} selected={member} onSelect={setMember} />
 *
 * - tant que rien n'est choisi : un champ de recherche + la liste des résultats
 * - une fois choisi : l'élément sélectionné + un bouton "Changer"
 */
export default function SearchPicker({ label, placeholder, fetcher, renderItem, renderSelected, selected, onSelect }) {
  const id = useId()
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 300)
  const results = useAsync(() => (selected ? Promise.resolve([]) : fetcher(debounced)), [debounced, Boolean(selected)])

  // min-w-0 : dans une grille, autorise le composant à rétrécir (les textes longs sont alors tronqués)
  if (selected) {
    return (
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800">{label}</p>
        <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-brand-300 bg-brand-50 px-3.5 py-2.5">
          <div className="min-w-0">{renderSelected(selected)}</div>
          <button type="button" onClick={() => onSelect(null)} className="shrink-0 text-sm font-medium text-brand-700 hover:underline">
            Changer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium text-stone-800">
        {label}
      </label>
      <div className="relative mt-1.5">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="block w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 sm:text-sm"
        />
      </div>

      <ul className="mt-2 max-h-64 divide-y divide-stone-100 overflow-y-auto rounded-lg border border-stone-200 bg-white" aria-label={`Résultats : ${label}`}>
        {results.loading && !results.data && <li className="px-3.5 py-3 text-sm text-stone-500">Recherche…</li>}
        {results.error && <li className="px-3.5 py-3 text-sm text-red-700">{results.error}</li>}
        {results.data?.length === 0 && <li className="px-3.5 py-3 text-sm text-stone-500">Aucun résultat.</li>}
        {results.data?.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-stone-50 focus:bg-stone-50 focus:outline-none"
            >
              {renderItem(item)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
