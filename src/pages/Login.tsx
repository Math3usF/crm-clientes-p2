import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { mensagemDeErro, statusDoErro } from '../utils/erros'

type EstadoDaRota = { de?: string } | null

export default function Login() {
  const { login, usuario, sessaoExpirada } = useAuth()
  const local = useLocation()

  const [username, setUsername] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    document.title = 'Entrar · CRM de clientes'
  }, [])

  const estado = local.state as EstadoDaRota
  const destino = estado?.de && estado.de !== '/login' ? estado.de : '/'

  // Já logado (ou acabou de entrar) volta para a página que tentou abrir.
  if (usuario) return <Navigate to={destino} replace />

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)

    if (!username.trim() || !senha) {
      setErro('Preencha usuário e senha para entrar.')
      return
    }

    setEnviando(true)
    try {
      await login(username, senha)
      // O <Navigate> acima leva ao destino; `replace` não deixa o Login no histórico.
    } catch (err) {
      const status = statusDoErro(err)
      if (status === 400 || status === 401) {
        setErro('Usuário ou senha incorretos.')
      } else {
        setErro(mensagemDeErro(err))
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="tela-login">
      <div className="login-card">
        <Link className="marca login-marca" to="/login" aria-label="CRM de clientes">
          <span className="marca-simbolo" aria-hidden="true">
            CRM
          </span>
          <span className="marca-texto">
            Clientes
            <small>painel comercial</small>
          </span>
        </Link>

        <p className="eyebrow">área restrita</p>
        <h1 className="login-titulo">Entrar no CRM</h1>
        <p className="login-sub">
          Atendimento, clientes, pedidos e histórico em um só lugar.
        </p>

        {sessaoExpirada && (
          <p className="aviso aviso-info" role="status">
            Sua sessão expirou. Entre de novo para continuar.
          </p>
        )}

        <form className="login-form" onSubmit={enviar} noValidate>
          <div className="campo">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              name="username"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(evento) => setUsername(evento.target.value)}
              aria-invalid={erro !== null}
              disabled={enviando}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              autoComplete="current-password"
              onChange={(evento) => setSenha(evento.target.value)}
              aria-invalid={erro !== null}
              disabled={enviando}
              required
            />
          </div>

          {erro && (
            <p className="aviso aviso-erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="btn btn-primario btn-bloco" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="login-dica">
          <p>
            <strong>Conta de teste:</strong> <code>emilys</code> / <code>emilyspass</code>
          </p>
        </div>
      </div>
    </div>
  )
}
