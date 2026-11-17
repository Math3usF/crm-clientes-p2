import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function NaoEncontrada() {
  const { usuario, carregando } = useAuth()

  useEffect(() => {
    document.title = 'Página não encontrada · CRM de clientes'
  }, [])

  return (
    <main className="tela-404">
      <div className="nao-encontrada-card">
        <p className="eyebrow">erro 404</p>
        <h1>Página não encontrada</h1>
        <p className="texto-suave">
          O endereço <code>{window.location.pathname}</code> não existe neste CRM.
        </p>
        {carregando ? (
          <p className="texto-suave" role="status">
            Verificando sessão…
          </p>
        ) : (
          <Link className="btn btn-primario" to={usuario ? '/' : '/login'}>
            {usuario ? 'Ir para o Painel' : 'Ir para o Login'}
          </Link>
        )}
      </div>
    </main>
  )
}
