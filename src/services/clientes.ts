import { api } from './http'
import { clienteDe, extrairLista, extrairUm, totalDaLista } from './normalizar'
import type { Cliente, DadosCliente, Id } from '../types'

export type ListaClientes = {
  clientes: Cliente[]
  total: number
}

export type OpcoesLista = {
  q?: string
  limit?: number
  skip?: number
}

/** GET /clientes?q=&limit=&skip= → { clientes, total } */
export async function listarClientes(opcoes: OpcoesLista = {}): Promise<ListaClientes> {
  const { q = '', limit = 5, skip = 0 } = opcoes
  const params: Record<string, string | number> = { limit, skip }
  if (q.trim()) params.q = q.trim()

  const { data } = await api.get('/clientes', { params })
  const brutos = extrairLista(data, ['clientes'])

  return {
    clientes: brutos.map(clienteDe),
    total: totalDaLista(data, brutos),
  }
}

/**
 * GET /clientes?limit=100 em todas as páginas.
 * A tela de pedidos precisa do nome de qualquer cliente e o Top 3 precisa de
 * todos os totais; a lista padrão do servidor só traz 30.
 */
export async function listarTodosClientes(): Promise<Cliente[]> {
  const todos: Cliente[] = []
  const limite = 100

  for (let skip = 0; skip <= 5000; skip += limite) {
    const pagina = await listarClientes({ limit: limite, skip })
    todos.push(...pagina.clientes)

    if (pagina.clientes.length === 0 || todos.length >= pagina.total) break
  }

  // Se o servidor ignorar `skip`, evita clientes repetidos na tela.
  const vistos = new Set<number>()
  return todos.filter((cliente) => {
    if (vistos.has(cliente.id)) return false
    vistos.add(cliente.id)
    return true
  })
}

export async function buscarCliente(id: Id): Promise<Cliente> {
  const { data } = await api.get(`/clientes/${id}`)
  return clienteDe(extrairUm(data, ['cliente']))
}

function corpoDoCliente(dados: DadosCliente) {
  return {
    nome: dados.nome.trim(),
    email: dados.email.trim(),
    telefone: dados.telefone.trim(),
    empresa: dados.empresa.trim(),
    cidade: dados.cidade.trim(),
  }
}

export async function criarCliente(dados: DadosCliente): Promise<Cliente> {
  const { data } = await api.post('/clientes', corpoDoCliente(dados))
  return clienteDe(extrairUm(data, ['cliente']))
}

export async function atualizarCliente(id: Id, dados: DadosCliente): Promise<Cliente> {
  const { data } = await api.patch(`/clientes/${id}`, corpoDoCliente(dados))
  return clienteDe(extrairUm(data, ['cliente']))
}

export async function excluirCliente(id: Id): Promise<void> {
  await api.delete(`/clientes/${id}`)
}
