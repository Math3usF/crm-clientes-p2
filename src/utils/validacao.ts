import type { DadosAtendimento, DadosCliente, ItemPedido } from '../types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ErrosCliente = Partial<Record<keyof DadosCliente | 'geral', string>>

export function validarCliente(dados: DadosCliente): ErrosCliente {
  const erros: ErrosCliente = {}

  if (!dados.nome.trim()) {
    erros.nome = 'Informe o nome do cliente.'
  } else if (dados.nome.trim().length < 2) {
    erros.nome = 'O nome precisa ter pelo menos 2 letras.'
  }

  if (!dados.email.trim()) {
    erros.email = 'Informe o e-mail.'
  } else if (!EMAIL.test(dados.email.trim())) {
    erros.email = 'Informe um e-mail válido (ex.: nome@empresa.com).'
  }

  const complementos = [dados.telefone, dados.empresa, dados.cidade].filter(
    (valor) => valor.trim().length > 0,
  )
  if (complementos.length < 2) {
    erros.geral = 'Preencha pelo menos 2 entre telefone, empresa e cidade.'
  }

  return erros
}

/** Devolve a primeira mensagem de erro dos itens, ou null se está tudo certo. */
export function validarItens(itens: ItemPedido[]): string | null {
  if (itens.length === 0) return 'Adicione pelo menos 1 item ao pedido.'

  for (let indice = 0; indice < itens.length; indice += 1) {
    const item = itens[indice]
    const numeroItem = indice + 1

    if (!item.titulo.trim()) return `Item ${numeroItem}: informe o título.`
    if (!Number.isFinite(item.preco) || item.preco < 0) {
      return `Item ${numeroItem}: o preço precisa ser maior ou igual a 0.`
    }
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) {
      return `Item ${numeroItem}: a quantidade precisa ser um número inteiro de 1 ou mais.`
    }
  }

  return null
}

export function validarAtendimento(dados: DadosAtendimento): string | null {
  if (!dados.titulo.trim()) return 'Informe o título do atendimento.'
  if (dados.titulo.trim().length < 2) return 'O título precisa ter pelo menos 2 letras.'
  if (!dados.texto.trim()) return 'Escreva o texto do atendimento.'
  return null
}
