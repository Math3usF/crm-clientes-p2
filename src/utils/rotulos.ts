import type { CanalAtendimento, Selo, StatusPedido } from '../types'

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  aberto: 'Aberto',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export const ROTULO_CANAL: Record<CanalAtendimento, string> = {
  telefone: 'Telefone',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
}

export const CANAIS: { valor: CanalAtendimento; rotulo: string }[] = [
  { valor: 'telefone', rotulo: 'Telefone' },
  { valor: 'email', rotulo: 'E-mail' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'presencial', rotulo: 'Presencial' },
]

export const ROTULO_SELO: Record<Selo, string> = {
  VIP: 'VIP',
  Regular: 'Regular',
  'Sem compras': 'Sem compras',
}

/**
 * Regras de mudança de status:
 * aberto → pago | cancelado · pago → cancelado · cancelado → nada.
 */
export function proximosStatus(status: StatusPedido): StatusPedido[] {
  if (status === 'aberto') return ['pago', 'cancelado']
  if (status === 'pago') return ['cancelado']
  return []
}

export function podeEditarItens(status: StatusPedido): boolean {
  return status === 'aberto'
}
