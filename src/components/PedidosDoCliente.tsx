import { useState, type FormEvent } from 'react'
import {
  atualizarPedido,
  criarPedido,
  excluirPedido,
  listarPedidosDoCliente,
} from '../services/pedidos'
import type { Id, ItemPedido, Pedido, StatusPedido } from '../types'
import { seloDoCliente, totalDoCliente, totalDoPedido } from '../utils/calculos'
import { mensagemDeErro } from '../utils/erros'
import { brl, formatarData } from '../utils/formato'
import { podeEditarItens, proximosStatus } from '../utils/rotulos'
import { validarItens } from '../utils/validacao'
import EditorItens from './EditorItens'
import StatusPedidoBadge from './StatusPedidoBadge'

type Props = {
  clienteId: Id
  pedidos: Pedido[]
  aoMudarPedidos: (pedidos: Pedido[]) => void
}

const ITEM_NOVO: ItemPedido = { titulo: '', preco: 0, quantidade: 1 }

function rotuloDoBotao(status: StatusPedido): string {
  if (status === 'pago') return 'Marcar como pago'
  return 'Cancelar pedido'
}

export default function PedidosDoCliente({ clienteId, pedidos, aoMudarPedidos }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [itensNovos, setItensNovos] = useState<ItemPedido[]>([{ ...ITEM_NOVO }])
  const [erroForm, setErroForm] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)

  const [editandoId, setEditandoId] = useState<Id | null>(null)
  const [itensEdicao, setItensEdicao] = useState<ItemPedido[]>([])
  const [salvandoItens, setSalvandoItens] = useState(false)

  const [ocupadoId, setOcupadoId] = useState<Id | null>(null)
  const [erroAcao, setErroAcao] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const totalComprado = totalDoCliente(pedidos, clienteId)
  const selo = seloDoCliente(totalComprado)

  async function recarregar() {
    const lista = await listarPedidosDoCliente(clienteId)
    aoMudarPedidos(lista)
  }

  function abrirFormulario() {
    setMostrarForm(true)
    setItensNovos([{ ...ITEM_NOVO }])
    setErroForm(null)
    setAviso(null)
  }

  function fecharFormulario() {
    setMostrarForm(false)
    setItensNovos([{ ...ITEM_NOVO }])
    setErroForm(null)
  }

  async function criar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setAviso(null)

    const erroValidacao = validarItens(itensNovos)
    if (erroValidacao) {
      setErroForm(erroValidacao)
      return
    }

    setErroForm(null)
    setCriando(true)
    try {
      await criarPedido(clienteId, itensNovos)
      await recarregar()
      fecharFormulario()
      setAviso('Pedido criado.')
    } catch (err) {
      setErroForm(mensagemDeErro(err))
    } finally {
      setCriando(false)
    }
  }

  function abrirEdicao(pedido: Pedido) {
    setEditandoId(pedido.id)
    setItensEdicao(pedido.itens.map((item) => ({ ...item })))
    setErroAcao(null)
    setAviso(null)
  }

  async function salvarItens(pedido: Pedido) {
    setErroAcao(null)
    setAviso(null)

    const erroValidacao = validarItens(itensEdicao)
    if (erroValidacao) {
      setErroAcao(erroValidacao)
      return
    }

    setSalvandoItens(true)
    try {
      await atualizarPedido(pedido.id, { itens: itensEdicao })
      await recarregar()
      setEditandoId(null)
      setItensEdicao([])
      setAviso('Itens do pedido atualizados.')
    } catch (err) {
      setErroAcao(mensagemDeErro(err))
    } finally {
      setSalvandoItens(false)
    }
  }

  async function mudarStatus(pedido: Pedido, status: StatusPedido) {
    setErroAcao(null)
    setAviso(null)
    setOcupadoId(pedido.id)

    try {
      await atualizarPedido(pedido.id, { status })
      await recarregar()
      setAviso(`Pedido #${pedido.id} agora está ${status}.`)
    } catch (err) {
      setErroAcao(mensagemDeErro(err))
    } finally {
      setOcupadoId(null)
    }
  }

  async function excluir(pedido: Pedido) {
    const confirmou = window.confirm(
      `Excluir o pedido #${pedido.id} de ${brl(totalDoPedido(pedido))}?`,
    )
    if (!confirmou) return

    setErroAcao(null)
    setAviso(null)
    setOcupadoId(pedido.id)

    try {
      await excluirPedido(pedido.id)
      await recarregar()
      setAviso('Pedido excluído.')
    } catch (err) {
      setErroAcao(mensagemDeErro(err))
    } finally {
      setOcupadoId(null)
    }
  }

  return (
    <section className="bloco" aria-labelledby="titulo-pedidos">
      <div className="bloco-cabecalho">
        <div>
          <h2 id="titulo-pedidos">Pedidos</h2>
          <p className="bloco-sub">
            {pedidos.length} pedido(s) · {brl(totalComprado)} em compras · selo{' '}
            <strong>{selo}</strong>
          </p>
        </div>

        {!mostrarForm && (
          <button type="button" className="btn btn-primario btn-pequeno" onClick={abrirFormulario}>
            + Novo pedido
          </button>
        )}
      </div>

      {erroAcao && (
        <p className="aviso aviso-erro" role="alert">
          {erroAcao}
        </p>
      )}

      {aviso && (
        <p className="aviso aviso-ok" role="status">
          {aviso}
        </p>
      )}

      {mostrarForm && (
        <form className="formulario formulario-bloco" onSubmit={criar} noValidate>
          <h3>Novo pedido</h3>
          <p className="texto-suave">
            Pelo menos 1 item. Título preenchido, preço maior ou igual a 0 e quantidade
            inteira de 1 ou mais.
          </p>

          <EditorItens
            itens={itensNovos}
            aoMudar={setItensNovos}
            desabilitado={criando}
            idPrefixo="novo-pedido"
          />

          {erroForm && (
            <p className="aviso aviso-erro" role="alert">
              {erroForm}
            </p>
          )}

          <div className="formulario-acoes">
            <button type="submit" className="btn btn-primario" disabled={criando}>
              {criando ? 'Criando…' : 'Criar pedido'}
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={fecharFormulario}
              disabled={criando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {pedidos.length === 0 && !mostrarForm ? (
        <div className="estado estado-vazio">
          <p className="estado-titulo">Nenhum pedido ainda.</p>
          <p className="estado-texto">Crie o primeiro pedido deste cliente.</p>
          <button type="button" className="btn btn-primario" onClick={abrirFormulario}>
            + Novo pedido
          </button>
        </div>
      ) : (
        <ul className="lista-pedidos">
          {pedidos.map((pedido) => {
            const total = totalDoPedido(pedido)
            const editando = editandoId === pedido.id
            const ocupado = ocupadoId === pedido.id
            const podeEditar = podeEditarItens(pedido.status)

            return (
              <li key={pedido.id} className="pedido-card">
                <div className="pedido-cabecalho">
                  <div>
                    <p className="pedido-titulo">
                      Pedido #{pedido.id} <StatusPedidoBadge status={pedido.status} />
                    </p>
                    <p className="pedido-data">{formatarData(pedido.criadoEm)}</p>
                  </div>
                  <strong className="pedido-total">{brl(total)}</strong>
                </div>

                {editando ? (
                  <div className="pedido-edicao">
                    <EditorItens
                      itens={itensEdicao}
                      aoMudar={setItensEdicao}
                      desabilitado={salvandoItens}
                      idPrefixo={`editar-${pedido.id}`}
                    />
                    <div className="formulario-acoes">
                      <button
                        type="button"
                        className="btn btn-primario btn-pequeno"
                        onClick={() => salvarItens(pedido)}
                        disabled={salvandoItens}
                      >
                        {salvandoItens ? 'Salvando…' : 'Salvar itens'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secundario btn-pequeno"
                        onClick={() => setEditandoId(null)}
                        disabled={salvandoItens}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className="pedido-itens">
                    {pedido.itens.map((item, indice) => (
                      <li key={`${pedido.id}-item-${indice}`}>
                        <span>
                          {item.quantidade}× {item.titulo}
                        </span>
                        <span>{brl(item.preco * item.quantidade)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {!editando && (
                  <div className="pedido-acoes">
                    {podeEditar && (
                      <button
                        type="button"
                        className="btn btn-secundario btn-pequeno"
                        onClick={() => abrirEdicao(pedido)}
                        disabled={ocupado}
                      >
                        Editar itens
                      </button>
                    )}

                    {proximosStatus(pedido.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={
                          status === 'cancelado'
                            ? 'btn btn-perigo-fantasma btn-pequeno'
                            : 'btn btn-secundario btn-pequeno'
                        }
                        onClick={() => mudarStatus(pedido, status)}
                        disabled={ocupado}
                      >
                        {ocupado ? 'Aguarde…' : rotuloDoBotao(status)}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn btn-perigo-fantasma btn-pequeno"
                      onClick={() => excluir(pedido)}
                      disabled={ocupado}
                    >
                      Excluir
                    </button>

                    {pedido.status === 'cancelado' && (
                      <p className="pedido-bloqueado">
                        Pedido cancelado não pode mais ser alterado.
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
