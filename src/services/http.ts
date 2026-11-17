import axios from 'axios'

/**
 * Uma única instância do Axios para o servidor-crm.
 * A URL vem do Vite (.env: VITE_API_URL) — nada de URL fixa espalhada no código.
 */
const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export const CHAVE_TOKEN = 'crm.token'

export const api = axios.create({
  baseURL: URL_API,
  timeout: 15000,
})

/** Todo pedido leva o token, sem repetir o header em cada service. */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

/**
 * 401 = sessão expirada. Quem sabe deslogar é o AuthContext; ele se registra aqui.
 * O 401 do próprio /auth/login é senha errada, não sessão vencida.
 */
let aoExpirar: (() => void) | null = null

export function registrarAoExpirar(funcao: (() => void) | null): void {
  aoExpirar = funcao
}

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (axios.isAxiosError(erro) && erro.response?.status === 401) {
      const url = String(erro.config?.url ?? '')
      if (!url.includes('/auth/login')) aoExpirar?.()
    }
    return Promise.reject(erro)
  },
)
