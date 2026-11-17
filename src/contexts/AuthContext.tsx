import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginApi, me } from '../services/auth'
import { CHAVE_TOKEN, registrarAoExpirar } from '../services/http'
import type { Usuario } from '../types'

type AuthValue = {
  /** Quem está logado (null = visitante). */
  usuario: Usuario | null
  token: string | null
  /** true enquanto restauramos a sessão ao abrir o app. */
  carregando: boolean
  /** true quando um 401 derrubou a sessão (a tela de Login avisa). */
  sessaoExpirada: boolean
  login: (username: string, senha: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [sessaoExpirada, setSessaoExpirada] = useState(false)

  const encerrarSessao = useCallback((expirada: boolean) => {
    localStorage.removeItem(CHAVE_TOKEN)
    setToken(null)
    setUsuario(null)
    setSessaoExpirada(expirada)
  }, [])

  const logout = useCallback(() => {
    encerrarSessao(false)
  }, [encerrarSessao])

  const entrar = useCallback(async (username: string, senha: string) => {
    // Se a senha estiver errada o service lança e o erro sobe para a tela de Login.
    const dados = await loginApi(username, senha)

    // Primeiro o localStorage (o interceptor lê de lá), depois o estado do React.
    localStorage.setItem(CHAVE_TOKEN, dados.accessToken)
    setToken(dados.accessToken)
    setUsuario(dados.usuario)
    setSessaoExpirada(false)
  }, [])

  // Ao abrir o app: se há token salvo, pergunta ao servidor quem é o dono.
  useEffect(() => {
    let ativo = true
    const salvo = localStorage.getItem(CHAVE_TOKEN)

    if (!salvo) {
      setCarregando(false)
      return
    }

    me()
      .then((dono) => {
        if (!ativo) return
        setToken(salvo)
        setUsuario(dono)
      })
      .catch(() => {
        if (!ativo) return
        localStorage.removeItem(CHAVE_TOKEN)
        setToken(null)
        setUsuario(null)
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [])

  // 401 em qualquer chamada → o interceptor avisa e nós encerramos a sessão.
  useEffect(() => {
    registrarAoExpirar(() => encerrarSessao(true))
    return () => registrarAoExpirar(null)
  }, [encerrarSessao])

  const valor = useMemo<AuthValue>(
    () => ({ usuario, token, carregando, sessaoExpirada, login: entrar, logout }),
    [usuario, token, carregando, sessaoExpirada, entrar, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

/** Hook customizado: lê o Context e falha cedo se faltou o Provider. */
export function useAuth(): AuthValue {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
