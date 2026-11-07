import { Route, Routes } from 'react-router'
import Layout from './components/layout/Layout'
import CatalogPage from './pages/CatalogPage'
import NotFoundPage from './pages/NotFoundPage'

/**
 * Plan du site (toutes les URL de l'application).
 * Les pages sont imbriquées dans <Layout> : elles partagent la barre de navigation et le pied de page.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogPage />} />
        {/* Étapes 11 à 14 : connexion, fiche livre, espace adhérent, administration */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
