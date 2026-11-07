import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import './index.css'

// Point d'entrée : React prend le contrôle de <div id="root"> dans index.html.
// - BrowserRouter : navigation entre pages sans recharger le navigateur
// - AuthProvider  : l'utilisateur connecté est accessible partout via useAuth()
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
