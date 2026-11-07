import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/errors'

/**
 * Hook réutilisable pour charger des données depuis l'API.
 *
 *   const { data, loading, error, reload } = useAsync(() => fetchBooks({ page }), [page])
 *
 * - loading : true pendant le chargement (pour afficher un indicateur)
 * - error   : message d'erreur en français, ou null
 * - reload  : relancer le chargement (bouton "Réessayer", après une action…)
 * - deps    : quand une de ces valeurs change, on recharge (comme useEffect)
 */
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false // évite de mettre à jour un composant qui n'est plus affiché

    // On garde les anciennes données pendant le rechargement (pas de "clignotement")
    setState((s) => ({ ...s, loading: true, error: null }))

    asyncFn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error: getErrorMessage(error) })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { ...state, reload }
}
