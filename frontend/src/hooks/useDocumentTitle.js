import { useEffect } from 'react'

/** Change le titre de l'onglet du navigateur : "Dune · BiblioQuartier" */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · BiblioQuartier` : 'BiblioQuartier'
  }, [title])
}
