export type Id = number

/** Usuário devolvido por POST /auth/login e GET /auth/me. */
export type Usuario = {
  id?: number
  username: string
  nome?: string
  firstName?: string
  lastName?: string
  email?: string
}

export type Cliente = {
  id: Id
  nome: string
  email: string
  telefone: string
  empresa: string
  cidade: string
  criadoEm: string | null
}

export type DadosCliente = {
  nome: string
  email: string
  telefone: string
  empresa: string
  cidade: string
}

export type ItemPedido = {
  titulo: string
  preco: number
  quantidade: number
}

export type StatusPedido = 'aberto' | 'pago' | 'cancelado'

export type Pedido = {
  id: Id
  clienteId: Id
  itens: ItemPedido[]
  status: StatusPedido
  criadoEm: string | null
}

export type CanalAtendimento = 'telefone' | 'email' | 'whatsapp' | 'presencial'

export type Atendimento = {
  id: Id
  clienteId: Id
  titulo: string
  texto: string
  canal: CanalAtendimento
  criadoEm: string | null
}

export type DadosAtendimento = {
  titulo: string
  texto: string
  canal: CanalAtendimento
}

export type Selo = 'VIP' | 'Regular' | 'Sem compras'
