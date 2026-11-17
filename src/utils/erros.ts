import axios from 'axios'

/** Status HTTP do erro (ou null quando nem houve resposta). */
export function statusDoErro(erro: unknown): number | null {
  if (axios.isAxiosError(erro)) return erro.response?.status ?? null
  return null
}

/** O servidor-crm manda o texto amigável em `message` (e às vezes em `erro`). */
function mensagemDoServidor(erro: unknown): string | null {
  if (!axios.isAxiosError(erro)) return null
  const dados = erro.response?.data
  if (!dados || typeof dados !== 'object') return null

  const bruto = (dados as Record<string, unknown>).message ?? (dados as Record<string, unknown>).erro
  if (typeof bruto === 'string' && bruto.trim()) return bruto.trim()
  return null
}

/**
 * Traduz o erro técnico em uma frase que a pessoa entende.
 * Regra da prova: nada de erro só no console — mensagem na tela.
 */
export function mensagemDeErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    if (erro.code === 'ECONNABORTED') {
      return 'O servidor demorou para responder. Tente de novo.'
    }

    if (!erro.response) {
      return 'Não foi possível falar com o servidor. Confira se ele está ligado (npm start) e tente de novo.'
    }

    const status = erro.response.status
    const doServidor = mensagemDoServidor(erro)

    if (status === 400) {
      return doServidor ?? 'Os dados enviados não foram aceitos. Confira os campos e tente de novo.'
    }
    if (status === 401) return 'Sua sessão expirou. Entre de novo.'
    if (status === 404) return 'Não encontramos o que você procura. Pode ter sido excluído.'
    if (status === 409) {
      return doServidor ?? 'Já existe um cliente com esse e-mail. Use outro e-mail.'
    }
    if (status === 422) {
      return doServidor ?? 'Confira os campos: tem algo inválido no formulário.'
    }
    if (status >= 500) {
      return doServidor ?? 'O servidor encontrou um problema. Tente de novo em instantes.'
    }

    return `Algo deu errado (código ${status}). Tente de novo.`
  }

  if (erro instanceof Error && erro.message) return erro.message
  return 'Erro inesperado. Tente de novo.'
}
