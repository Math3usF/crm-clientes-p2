import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { nomeDoUsuario } from '../utils/formato'

const classeDoLink = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'nav-link ativo' : 'nav-link'

export default function Header() {
  const { usuario, logout } = useAuth()
  const nome = usuario ? nomeDoUsuario(usuario) : ''

  return (
    <header className="topo">
      <div className="topo-interno">
        <NavLink className="marca" to="/" aria-label="CRM de clientes — ir para o Painel">
          <span className="marca-simbolo" aria-hidden="true">
            CRM
          </span>
          <span className="marca-texto">
            Clientes
            <small>painel comercial</small>
          </span>
        </NavLink>

        <nav className="nav" aria-label="Navegação principal">
          <NavLink to="/" end className={classeDoLink}>
            Painel
          </NavLink>
          <NavLink to="/clientes" end className={classeDoLink}>
            Clientes
          </NavLink>
          <NavLink to="/pedidos" className={classeDoLink}>
            Pedidos
          </NavLink>
          <NavLink to="/clientes/novo" className={classeDoLink}>
            Novo cliente
          </NavLink>
        </nav>

        <div className="topo-usuario">
          <span className="topo-ola" title={usuario?.email ?? undefined}>
            Olá, <strong>{nome}</strong>
          </span>
          <button type="button" className="btn btn-fantasma" onClick={logout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
