import { Route, Routes } from 'react-router'
import RequireAuth from './components/auth/RequireAuth'
import Layout from './components/layout/Layout'
import { ROLES } from './context/AuthContext'
import AdminHomePage from './pages/admin/AdminHomePage'
import CatalogPage from './pages/CatalogPage'
import LoginPage from './pages/LoginPage'
import MemberHomePage from './pages/member/MemberHomePage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'

/**
 * Plan du site (toutes les URL de l'application).
 * Les pages sont imbriquées dans <Layout> : elles partagent la barre de navigation et le pied de page.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* ---------- Public (visiteur) ---------- */}
        <Route index element={<CatalogPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="inscription" element={<RegisterPage />} />

        {/* ---------- Adhérent ---------- */}
        <Route element={<RequireAuth role={ROLES.ADHERENT} />}>
          <Route path="mon-espace" element={<MemberHomePage />} />
        </Route>

        {/* ---------- Bibliothécaire ---------- */}
        <Route element={<RequireAuth role={ROLES.BIBLIOTHECAIRE} />}>
          <Route path="admin" element={<AdminHomePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
