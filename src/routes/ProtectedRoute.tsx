import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Portaria: só entra quem tem sessão.
 * Enquanto o AuthProvider restaura o token, mostramos "Verificando sessão…"
 * para não expulsar quem está logado ao dar F5.
 */
export default function ProtectedRoute() {
  const { usuario, carregando } = useAuth()
  const local = useLocation()

  if (carregando) {
    return (
      <main className="tela-espera">
        <p role="status">Verificando sessão…</p>
      </main>
    )
  }

  if (!usuario) {
    const destino = `${local.pathname}${local.search}`
    return <Navigate to="/login" replace state={{ de: destino }} />
  }

  return <Outlet />
}
