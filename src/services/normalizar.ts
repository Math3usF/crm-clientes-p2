import type {
  Atendimento,
  CanalAtendimento,
  Cliente,
  Id,
  ItemPedido,
  Pedido,
  StatusPedido,
} from '../types'

/**
 * Adaptadores entre a resposta crua do servidor e os tipos do app.
 * O servidor pode devolver a lista direto ou dentro de { clientes }, { pedidos },
 * { atendimentos }; aqui aceitamos os dois formatos.
 */

export type Cru = Record<string, unknown>

export function registro(valor: unknown): Cru {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Cru)
    : {}
}

export function texto(valor: unknown): string {
  if (typeof valor === 'string') return valor
  if (typeof valor === 'number' && Number.isFinite(valor)) return String(valor)
  return ''
}

export function numero(valor: unknown): number {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor
  if (typeof valor === 'string' && valor.trim()) {
    const convertido = Number(valor.replace(',', '.'))
    return Number.isFinite(convertido) ? convertido : 0
  }
  return 0
}

export function inteiro(valor: unknown): number {
  return Math.trunc(numero(valor))
}

export function idDe(valor: unknown): Id {
  // Alguns servidores mandam id como texto ("3"); o app trabalha com número.
  const convertido = Number(texto(valor) || valor)
  return Number.isFinite(convertido) ? convertido : 0
}

/** "2026-11-17" — data sem hora, como o servidor-crm grava pedidos e atendimentos. */
const SO_DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * O servidor manda `data` só com o dia ("2026-11-03"). Devolvemos a string
 * como veio, porque `new Date("2026-11-03")` é meia-noite UTC e, no horário
 * de Brasília, apareceria como o dia anterior. Quem formata sabe tratar isso.
 */
export function dataDe(objeto: Cru): string | null {
  const bruto =
    objeto.criadoEm ??
    objeto.criado_em ??
    objeto.data ??
    objeto.createdAt ??
    objeto.date ??
    objeto.dataHora

  if (typeof bruto === 'number' && Number.isFinite(bruto)) {
    const data = new Date(bruto)
    return Number.isNaN(data.getTime()) ? null : data.toISOString()
  }

  if (typeof bruto === 'string' && bruto.trim()) {
    const valor = bruto.trim()

    if (SO_DATA.test(valor)) {
      // Rejeita datas impossíveis (2026-02-31), que o Date "corrigiria".
      const [ano, mes, dia] = valor.split('-').map(Number)
      const conferida = new Date(ano, mes - 1, dia)
      const valida =
        conferida.getFullYear() === ano &&
        conferida.getMonth() === mes - 1 &&
        conferida.getDate() === dia
      return valida ? valor : null
    }

    const data = new Date(valor)
    return Number.isNaN(data.getTime()) ? null : data.toISOString()
  }

  return null
}

/** Pega a lista em si (array direto) ou dentro de uma das chaves conhecidas. */
export function extrairLista(dados: unknown, chaves: string[]): unknown[] {
  if (Array.isArray(dados)) return dados

  const objeto = registro(dados)
  const candidatas = [...chaves, 'data', 'dados', 'items', 'results', 'registros']

  for (const chave of candidatas) {
    const valor = objeto[chave]
    if (Array.isArray(valor)) return valor
  }

  return []
}

/** Pega um recurso único, aceitando { cliente: {...} } e array de um item. */
export function extrairUm(dados: unknown, chaves: string[]): unknown {
  if (Array.isArray(dados)) return dados[0]

  const objeto = registro(dados)
  for (const chave of [...chaves, 'data', 'dados']) {
    const valor = objeto[chave]
    if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) return valor
  }

  return dados
}

export function totalDaLista(dados: unknown, lista: unknown[]): number {
  const objeto = registro(dados)
  const bruto = objeto.total ?? objeto.count ?? objeto.quantidade
  if (bruto !== undefined && bruto !== null) return Math.max(0, inteiro(bruto))
  return lista.length
}

export function clienteDe(valor: unknown): Cliente {
  const objeto = registro(valor)
  return {
    id: idDe(objeto.id ?? objeto.clienteId),
    nome: texto(objeto.nome ?? objeto.name),
    email: texto(objeto.email ?? objeto.eMail),
    telefone: texto(objeto.telefone ?? objeto.phone),
    empresa: texto(objeto.empresa ?? objeto.company),
    cidade: texto(objeto.cidade ?? objeto.city),
    criadoEm: dataDe(objeto),
  }
}

function statusDe(valor: unknown): StatusPedido {
  const bruto = texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

  if (bruto.startsWith('pag') || bruto === 'paid') return 'pago'
  if (bruto.startsWith('cancel')) return 'cancelado'
  return 'aberto'
}

function canalDe(valor: unknown): CanalAtendimento {
  const bruto = texto(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

  if (bruto.includes('whats')) return 'whatsapp'
  if (bruto.includes('email')) return 'email'
  if (bruto.includes('presencial')) return 'presencial'
  return 'telefone'
}

export function itemDe(valor: unknown): ItemPedido {
  const objeto = registro(valor)
  const quantidade = inteiro(
    objeto.quantidade ?? objeto.qtd ?? objeto.quantity ?? 1,
  )
  return {
    titulo: texto(objeto.titulo ?? objeto.title ?? objeto.nome ?? objeto.descricao),
    preco: numero(objeto.preco ?? objeto.price ?? objeto.valor),
    quantidade: quantidade > 0 ? quantidade : 1,
  }
}

export function pedidoDe(valor: unknown): Pedido {
  const objeto = registro(valor)
  const cliente = registro(objeto.cliente)
  const brutosItens = Array.isArray(objeto.itens)
    ? objeto.itens
    : Array.isArray(objeto.items)
      ? objeto.items
      : []

  return {
    id: idDe(objeto.id),
    clienteId: idDe(objeto.clienteId ?? objeto.cliente_id ?? cliente.id),
    itens: brutosItens.map(itemDe),
    status: statusDe(objeto.status),
    criadoEm: dataDe(objeto),
  }
}

export function atendimentoDe(valor: unknown): Atendimento {
  const objeto = registro(valor)
  const cliente = registro(objeto.cliente)
  return {
    id: idDe(objeto.id),
    clienteId: idDe(objeto.clienteId ?? objeto.cliente_id ?? cliente.id),
    titulo: texto(objeto.titulo ?? objeto.assunto ?? objeto.title),
    texto: texto(objeto.texto ?? objeto.descricao ?? objeto.mensagem ?? objeto.text),
    canal: canalDe(objeto.canal ?? objeto.channel),
    criadoEm: dataDe(objeto),
  }
}
