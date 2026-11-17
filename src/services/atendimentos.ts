import { api } from './http'
import { atendimentoDe, extrairLista, extrairUm } from './normalizar'
import type { Atendimento, DadosAtendimento, Id } from '../types'

export async function listarAtendimentosDoCliente(clienteId: Id): Promise<Atendimento[]> {
  const { data } = await api.get(`/clientes/${clienteId}/atendimentos`)
  return extrairLista(data, ['atendimentos']).map(atendimentoDe)
}

export async function criarAtendimento(
  clienteId: Id,
  dados: DadosAtendimento,
): Promise<Atendimento> {
  const { data } = await api.post(`/clientes/${clienteId}/atendimentos`, {
    titulo: dados.titulo.trim(),
    texto: dados.texto.trim(),
    canal: dados.canal,
  })
  return atendimentoDe(extrairUm(data, ['atendimento']))
}

export async function atualizarAtendimento(
  id: Id,
  dados: DadosAtendimento,
): Promise<Atendimento> {
  const { data } = await api.patch(`/atendimentos/${id}`, {
    titulo: dados.titulo.trim(),
    texto: dados.texto.trim(),
    canal: dados.canal,
  })
  return atendimentoDe(extrairUm(data, ['atendimento']))
}

export async function excluirAtendimento(id: Id): Promise<void> {
  await api.delete(`/atendimentos/${id}`)
}
