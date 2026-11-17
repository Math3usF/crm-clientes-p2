import type {
  Atendimento,
  CanalAtendimento,
  Cliente,
  Id,
  Pedido,
  Selo,
  StatusPedido,
} from '../types'
import { timestamp } from './formato'

/**
 * Cálculos do CRM — funções puras, sem React e sem chamadas de API.
 * O Painel, a lista, o detalhe e a tela de pedidos usam estas mesmas funções,
 * então os números sempre batem entre as telas.
 */

/** Evita centavos "quebrados" por ponto flutuante (19.99 * 3). */
export function arredondarMoeda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

export function totalDoPedido(pedido: Pedido): number {
  return arredondarMoeda(
    pedido.itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
  )
}

/** Pedido cancelado não entra em total vendido, ticket médio, selo nem Top 3. */
export function pedidoVale(pedido: Pedido): boolean {
  return pedido.status !== 'cancelado'
}

export function totalDoCliente(pedidos: Pedido[], clienteId: Id): number {
  return arredondarMoeda(
    pedidos
      .filter((pedido) => pedido.clienteId === clienteId && pedidoVale(pedido))
      .reduce((soma, pedido) => soma + totalDoPedido(pedido), 0),
  )
}

export function seloDoCliente(totalComprado: number): Selo {
  if (totalComprado <= 0) return 'Sem compras'
  if (totalComprado >= 2000) return 'VIP'
  return 'Regular'
}

export type ResumoStatus = {
  quantidade: number
  valor: number
}

export type ResumoPainel = {
  totalVendido: number
  ticketMedio: number
  pedidosValidos: number
  porStatus: Record<StatusPedido, ResumoStatus>
}

export function resumoPainel(pedidos: Pedido[]): ResumoPainel {
  const porStatus: Record<StatusPedido, ResumoStatus> = {
    aberto: { quantidade: 0, valor: 0 },
    pago: { quantidade: 0, valor: 0 },
    cancelado: { quantidade: 0, valor: 0 },
  }

  let totalVendido = 0
  let pedidosValidos = 0

  for (const pedido of pedidos) {
    const total = totalDoPedido(pedido)
    porStatus[pedido.status].quantidade += 1
    porStatus[pedido.status].valor = arredondarMoeda(porStatus[pedido.status].valor + total)

    if (pedidoVale(pedido)) {
      totalVendido += total
      pedidosValidos += 1
    }
  }

  totalVendido = arredondarMoeda(totalVendido)

  return {
    totalVendido,
    ticketMedio: pedidosValidos > 0 ? arredondarMoeda(totalVendido / pedidosValidos) : 0,
    pedidosValidos,
    porStatus,
  }
}

export type LinhaTopCliente = {
  cliente: Cliente
  total: number
}

export function topClientes(
  clientes: Cliente[],
  pedidos: Pedido[],
  limite = 3,
): LinhaTopCliente[] {
  return clientes
    .map((cliente) => ({
      cliente,
      total: totalDoCliente(pedidos, cliente.id),
    }))
    .filter((linha) => linha.total > 0)
    .sort((a, b) => b.total - a.total || a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'))
    .slice(0, limite)
}

export type FiltroStatus = 'todos' | StatusPedido

export type FaixaValor = 'todas' | 'ate-500' | '500-2000' | '2000-mais'

/** Faixas sem sobreposição: < 500 · 500 a 1.999,99 · >= 2.000. */
export function valorNaFaixa(total: number, faixa: FaixaValor): boolean {
  if (faixa === 'todas') return true
  if (faixa === 'ate-500') return total < 500
  if (faixa === '500-2000') return total >= 500 && total < 2000
  return total >= 2000
}

export function filtrarPedidos(
  pedidos: Pedido[],
  filtros: { status: FiltroStatus; faixa: FaixaValor },
): Pedido[] {
  return pedidos.filter((pedido) => {
    if (filtros.status !== 'todos' && pedido.status !== filtros.status) return false
    return valorNaFaixa(totalDoPedido(pedido), filtros.faixa)
  })
}

export type OrdemPedidos = 'data-desc' | 'data-asc' | 'total-desc' | 'total-asc'

export function ordenarPedidos(pedidos: Pedido[], ordem: OrdemPedidos): Pedido[] {
  const copia = [...pedidos]
  copia.sort((a, b) => {
    if (ordem === 'total-desc' || ordem === 'total-asc') {
      const diferenca = totalDoPedido(a) - totalDoPedido(b)
      const porTotal = ordem === 'total-asc' ? diferenca : -diferenca
      return porTotal || a.id - b.id
    }

    const diferenca = timestamp(a.criadoEm) - timestamp(b.criadoEm)
    const porData = ordem === 'data-asc' ? diferenca : -diferenca
    return porData || a.id - b.id
  })
  return copia
}

export type FiltroCanal = 'todos' | CanalAtendimento

export function filtrarAtendimentos(
  atendimentos: Atendimento[],
  canal: FiltroCanal,
): Atendimento[] {
  if (canal === 'todos') return atendimentos
  return atendimentos.filter((atendimento) => atendimento.canal === canal)
}

/** Mais recente primeiro; sem data vai para o fim. */
export function ordenarAtendimentos(atendimentos: Atendimento[]): Atendimento[] {
  return [...atendimentos].sort((a, b) => {
    const dataA = timestamp(a.criadoEm)
    const dataB = timestamp(b.criadoEm)
    if (dataA === 0 && dataB !== 0) return 1
    if (dataB === 0 && dataA !== 0) return -1
    return dataB - dataA || b.id - a.id
  })
}
