import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ClienteDetalhe from './pages/ClienteDetalhe'
import ClienteForm from './pages/ClienteForm'
import Clientes from './pages/Clientes'
import Login from './pages/Login'
import NaoEncontrada from './pages/NaoEncontrada'
import Painel from './pages/Painel'
import Pedidos from './pages/Pedidos'
import ProtectedRoute from './routes/ProtectedRoute'

/**
 * Mapa de rotas:
 * /login é a única pública; o resto passa pela portaria (ProtectedRoute)
 * e pela moldura (Layout). Qualquer outra URL cai na página 404.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Painel />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/novo" element={<ClienteForm />} />
          <Route path="clientes/:id" element={<ClienteDetalhe />} />
          <Route path="clientes/:id/editar" element={<ClienteForm />} />
          <Route path="pedidos" element={<Pedidos />} />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  )
}
