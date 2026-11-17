import type { ItemPedido } from '../types'
import { arredondarMoeda } from '../utils/calculos'
import { brl } from '../utils/formato'

type Props = {
  itens: ItemPedido[]
  aoMudar: (itens: ItemPedido[]) => void
  desabilitado?: boolean
  idPrefixo: string
}

/**
 * Editor de itens usado tanto no pedido novo quanto na edição de um pedido aberto.
 * O pai é dono do estado; aqui só avisamos o que mudou.
 */
export default function EditorItens({
  itens,
  aoMudar,
  desabilitado = false,
  idPrefixo,
}: Props) {
  function alterarTitulo(indice: number, titulo: string) {
    aoMudar(itens.map((item, posicao) => (posicao === indice ? { ...item, titulo } : item)))
  }

  function alterarPreco(indice: number, preco: number) {
    aoMudar(itens.map((item, posicao) => (posicao === indice ? { ...item, preco } : item)))
  }

  function alterarQuantidade(indice: number, quantidade: number) {
    aoMudar(
      itens.map((item, posicao) => (posicao === indice ? { ...item, quantidade } : item)),
    )
  }

  function adicionar() {
    aoMudar([...itens, { titulo: '', preco: 0, quantidade: 1 }])
  }

  function remover(indice: number) {
    aoMudar(itens.filter((_, posicao) => posicao !== indice))
  }

  const total = arredondarMoeda(
    itens.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
  )

  return (
    <div className="editor-itens">
      {itens.map((item, indice) => (
        <fieldset className="item-pedido" key={`${idPrefixo}-${indice}`}>
          <legend>Item {indice + 1}</legend>

          <div className="campo">
            <label htmlFor={`${idPrefixo}-titulo-${indice}`}>Título</label>
            <input
              id={`${idPrefixo}-titulo-${indice}`}
              value={item.titulo}
              onChange={(evento) => alterarTitulo(indice, evento.target.value)}
              disabled={desabilitado}
              placeholder="Ex.: Plano de internet"
            />
          </div>

          <div className="item-pedido-linha">
            <div className="campo">
              <label htmlFor={`${idPrefixo}-preco-${indice}`}>Preço (R$)</label>
              <input
                id={`${idPrefixo}-preco-${indice}`}
                type="number"
                min="0"
                step="0.01"
                value={item.preco}
                onChange={(evento) => alterarPreco(indice, Number(evento.target.value))}
                disabled={desabilitado}
              />
            </div>

            <div className="campo">
              <label htmlFor={`${idPrefixo}-qtd-${indice}`}>Quantidade</label>
              <input
                id={`${idPrefixo}-qtd-${indice}`}
                type="number"
                min="1"
                step="1"
                value={item.quantidade}
                onChange={(evento) =>
                  alterarQuantidade(indice, Number(evento.target.value))
                }
                disabled={desabilitado}
              />
            </div>

            <button
              type="button"
              className="btn btn-perigo-fantasma btn-remover-item"
              onClick={() => remover(indice)}
              disabled={desabilitado || itens.length === 1}
            >
              Remover
            </button>
          </div>
        </fieldset>
      ))}

      <div className="editor-itens-rodape">
        <button type="button" className="btn btn-secundario" onClick={adicionar} disabled={desabilitado}>
          + Adicionar item
        </button>
        <p className="editor-total">
          Total do pedido: <strong>{brl(total)}</strong>
        </p>
      </div>
    </div>
  )
}
