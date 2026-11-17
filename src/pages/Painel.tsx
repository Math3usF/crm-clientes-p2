import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, Erro } from '../components/Estados'
import { listarTodosClientes } from '../services/clientes'
import { listarTodosPedidos } from '../services/pedidos'
import type { Cliente, Pedido } from '../types'
import { resumoPainel, topClientes } from '../utils/calculos'
import { mensagemDeErro } from '../utils/erros'
import { brl, numero } from '../utils/formato'
import { ROTULO_STATUS } from '../utils/rotulos'

export default function Painel() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    document.title = 'Painel · CRM de clientes'
  }, [])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    Promise.all([listarTodosClientes(), listarTodosPedidos()])
      .then(([listaClientes, listaPedidos]) => {
        if (!ativo) return
        setClientes(listaClientes)
        setPedidos(listaPedidos)
      })
      .catch((err: unknown) => {
        if (ativo) setErro(mensagemDeErro(err))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar])

  if (carregando) return <Carregando titulo="Carregando o painel…" />

  if (erro) {
    return (
      <Erro aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)}>
        {erro}
      </Erro>
    )
  }

  const resumo = resumoPainel(pedidos)
  const top = topClientes(clientes, pedidos, 3)
  const status: Array<'aberto' | 'pago' | 'cancelado'> = ['aberto', 'pago', 'cancelado']

  return (
    <section className="secao">
      <div className="secao-cabecalho">
        <p className="eyebrow">visão geral</p>
        <h1 className="secao-titulo">Painel</h1>
        <p className="secao-sub">
          Total de clientes, vendas e pedidos. Pedidos cancelados ficam de fora do total
          vendido, do ticket médio, do selo e do Top 3.
        </p>
      </div>

      <div className="cards-resumo">
        <article className="card-numero">
          <p className="card-rotulo">Clientes</p>
          <p className="card-valor">{numero(clientes.length)}</p>
          <Link className="card-link" to="/clientes">
            Ver clientes
          </Link>
        </article>

        <article className="card-numero">
          <p className="card-rotulo">Total vendido</p>
          <p className="card-valor">{brl(resumo.totalVendido)}</p>
          <p className="card-detalhe">Pedidos abertos + pagos</p>
        </article>

        <article className="card-numero">
          <p className="card-rotulo">Ticket médio</p>
          <p className="card-valor">{brl(resumo.ticketMedio)}</p>
          <p className="card-detalhe">
            {numero(resumo.pedidosValidos)} pedido(s) válido(s)
          </p>
        </article>
      </div>

      <div className="painel-grade">
        <article className="bloco">
          <div className="bloco-cabecalho">
            <h2>Pedidos por status</h2>
            <Link className="link-acao" to="/pedidos">
              Ver todos
            </Link>
          </div>

          <ul className="lista-status">
            {status.map((chave) => (
              <li key={chave} className="linha-status">
                <span className={`status status-${chave}`}>{ROTULO_STATUS[chave]}</span>
                <span className="linha-status-numeros">
                  <strong>{numero(resumo.porStatus[chave].quantidade)}</strong>
                  <span>{brl(resumo.porStatus[chave].valor)}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="bloco">
          <div className="bloco-cabecalho">
            <h2>Top 3 clientes</h2>
            <span className="bloco-nota">sem cancelados</span>
          </div>

          {top.length === 0 ? (
            <p className="texto-suave">Ainda não há compras para montar o Top 3.</p>
          ) : (
            <ol className="top-clientes">
              {top.map((linha, indice) => (
                <li key={linha.cliente.id} className="top-linha">
                  <span className="top-posicao" aria-hidden="true">
                    {indice + 1}
                  </span>
                  <span className="top-nome">
                    <Link to={`/clientes/${linha.cliente.id}`}>{linha.cliente.nome}</Link>
                    <small>{linha.cliente.email}</small>
                  </span>
                  <strong className="top-valor">{brl(linha.total)}</strong>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>

      <div className="atalhos">
        <Link className="btn btn-primario" to="/clientes/novo">
          + Novo cliente
        </Link>
        <Link className="btn btn-secundario" to="/clientes">
          Lista de clientes
        </Link>
        <Link className="btn btn-secundario" to="/pedidos">
          Todos os pedidos
        </Link>
      </div>
    </section>
  )
}
