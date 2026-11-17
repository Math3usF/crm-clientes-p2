/** Formatação para a interface. Funções puras, sem estado. */

export function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function numero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

const SO_DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Converte a string da API em Date. Data sem hora ("2026-11-03") é montada ao
 * meio-dia local para não cair no dia anterior por causa do fuso (UTC-3).
 */
function comoData(iso: string): Date | null {
  if (SO_DATA.test(iso)) {
    const [ano, mes, dia] = iso.split('-').map(Number)
    return new Date(ano, mes - 1, dia, 12, 0, 0)
  }
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? null : valor
}

/** Timestamp de uma data ISO; 0 quando não existe ou é inválida. */
export function timestamp(iso: string | null | undefined): number {
  if (!iso) return 0
  return comoData(iso)?.getTime() ?? 0
}

export function formatarData(iso: string | null | undefined): string {
  const data = iso ? comoData(iso) : null
  if (!data) return 'Sem data'
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatarDataHora(iso: string | null | undefined): string {
  const data = iso ? comoData(iso) : null
  if (!data) return 'Sem data'

  // Pedido e atendimento antigos vêm só com o dia: não inventa "00:00".
  if (iso && SO_DATA.test(iso)) return formatarData(iso)

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Nome de exibição do usuário logado, com fallbacks para o que a API mandar. */
export function nomeDoUsuario(usuario: {
  nome?: string
  firstName?: string
  lastName?: string
  username: string
}): string {
  const completo = [usuario.firstName, usuario.lastName].filter(Boolean).join(' ').trim()
  return usuario.nome?.trim() || completo || usuario.username
}
