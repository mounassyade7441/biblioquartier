import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Accès à l'authentification depuis n'importe quel composant :
 *   const { user, isLibrarian, login, logout } = useAuth()
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() doit être utilisé à l\'intérieur de <AuthProvider>.')
  }
  return context
}
