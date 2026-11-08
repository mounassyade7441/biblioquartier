import { Route, Routes } from 'react-router'
import AdminLayout from './components/admin/AdminLayout'
import RequireAuth from './components/auth/RequireAuth'
import Layout from './components/layout/Layout'
import { ROLES } from './context/AuthContext'
import AdminHomePage from './pages/admin/AdminHomePage'
import BookFormPage from './pages/admin/BookFormPage'
import BooksAdminPage from './pages/admin/BooksAdminPage'
import CategoriesPage from './pages/admin/CategoriesPage'
import LoansPage from './pages/admin/LoansPage'
import BookDetailPage from './pages/BookDetailPage'
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
        <Route path="livres/:id" element={<BookDetailPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route path="inscription" element={<RegisterPage />} />

        {/* ---------- Adhérent ---------- */}
        <Route element={<RequireAuth role={ROLES.ADHERENT} />}>
          <Route path="mon-espace" element={<MemberHomePage />} />
        </Route>

        {/* ---------- Bibliothécaire ---------- */}
        <Route element={<RequireAuth role={ROLES.BIBLIOTHECAIRE} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="prets" element={<LoansPage />} />
            <Route path="livres" element={<BooksAdminPage />} />
            <Route path="livres/nouveau" element={<BookFormPage />} />
            <Route path="livres/:id/modifier" element={<BookFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
