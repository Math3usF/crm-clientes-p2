import { api } from './http'
import { extrairLista, extrairUm, pedidoDe } from './normalizar'
import type { Id, ItemPedido, Pedido, StatusPedido } from '../types'

function corpoDosItens(itens: ItemPedido[]) {
  return itens.map((item) => ({
    titulo: item.titulo.trim(),
    preco: item.preco,
    quantidade: item.quantidade,
  }))
}

/** GET /pedidos → todos os pedidos (Painel e tela Pedidos). */
export async function listarTodosPedidos(): Promise<Pedido[]> {
  const { data } = await api.get('/pedidos')
  return extrairLista(data, ['pedidos']).map(pedidoDe)
}

/** GET /clientes/:id/pedidos */
export async function listarPedidosDoCliente(clienteId: Id): Promise<Pedido[]> {
  const { data } = await api.get(`/clientes/${clienteId}/pedidos`)
  return extrairLista(data, ['pedidos']).map(pedidoDe)
}

/** POST /clientes/:id/pedidos com pelo menos 1 item. */
export async function criarPedido(
  clienteId: Id,
  itens: ItemPedido[],
): Promise<Pedido> {
  const { data } = await api.post(`/clientes/${clienteId}/pedidos`, {
    itens: corpoDosItens(itens),
  })
  return pedidoDe(extrairUm(data, ['pedido']))
}

/** PATCH /pedidos/:id — itens (só aberto) ou status. */
export async function atualizarPedido(
  id: Id,
  campos: { itens?: ItemPedido[]; status?: StatusPedido },
): Promise<Pedido> {
  const corpo: Record<string, unknown> = {}
  if (campos.itens) corpo.itens = corpoDosItens(campos.itens)
  if (campos.status) corpo.status = campos.status

  const { data } = await api.patch(`/pedidos/${id}`, corpo)
  return pedidoDe(extrairUm(data, ['pedido']))
}

export async function excluirPedido(id: Id): Promise<void> {
  await api.delete(`/pedidos/${id}`)
}
