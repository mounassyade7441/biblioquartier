import { useEffect, useState } from 'react'

/**
 * Renvoie la valeur seulement quand elle n'a pas changé depuis `delay` ms.
 * Sert aux champs de recherche : on n'appelle pas l'API à chaque lettre tapée.
 *
 *   const debouncedQuery = useDebouncedValue(query, 300)
 */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
