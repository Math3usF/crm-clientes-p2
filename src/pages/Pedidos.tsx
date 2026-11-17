import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, Erro, Vazio } from '../components/Estados'
import StatusPedidoBadge from '../components/StatusPedidoBadge'
import { listarTodosClientes } from '../services/clientes'
import { listarTodosPedidos } from '../services/pedidos'
import type { Cliente, Pedido } from '../types'
import {
  filtrarPedidos,
  ordenarPedidos,
  totalDoPedido,
  type FaixaValor,
  type FiltroStatus,
  type OrdemPedidos,
} from '../utils/calculos'
import { mensagemDeErro } from '../utils/erros'
import { brl, formatarData, numero } from '../utils/formato'
import { ROTULO_STATUS } from '../utils/rotulos'

const FAIXAS: { valor: FaixaValor; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas as faixas' },
  { valor: 'ate-500', rotulo: 'Menos de R$ 500' },
  { valor: '500-2000', rotulo: 'De R$ 500 a R$ 1.999,99' },
  { valor: '2000-mais', rotulo: 'R$ 2.000 ou mais' },
]

const ORDENS: { valor: OrdemPedidos; rotulo: string }[] = [
  { valor: 'data-desc', rotulo: 'Data (mais recente)' },
  { valor: 'data-asc', rotulo: 'Data (mais antiga)' },
  { valor: 'total-desc', rotulo: 'Total (maior)' },
  { valor: 'total-asc', rotulo: 'Total (menor)' },
]

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [recarregar, setRecarregar] = useState(0)

  const [status, setStatus] = useState<FiltroStatus>('todos')
  const [faixa, setFaixa] = useState<FaixaValor>('todas')
  const [ordem, setOrdem] = useState<OrdemPedidos>('data-desc')

  useEffect(() => {
    document.title = 'Pedidos · CRM de clientes'
  }, [])

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro(null)

    Promise.all([listarTodosPedidos(), listarTodosClientes()])
      .then(([listaPedidos, listaClientes]) => {
        if (!ativo) return
        setPedidos(listaPedidos)
        setClientes(listaClientes)
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

  if (carregando) return <Carregando titulo="Carregando pedidos…" />

  if (erro) {
    return (
      <Erro aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)}>{erro}</Erro>
    )
  }

  const nomePorCliente = new Map(clientes.map((cliente) => [cliente.id, cliente.nome]))
  const filtrados = ordenarPedidos(filtrarPedidos(pedidos, { status, faixa }), ordem)
  const totalFiltrado = filtrados.reduce((soma, pedido) => soma + totalDoPedido(pedido), 0)
  const temFiltro = status !== 'todos' || faixa !== 'todas'

  function limparFiltros() {
    setStatus('todos')
    setFaixa('todas')
    setOrdem('data-desc')
  }

  return (
    <section className="secao">
      <div className="secao-cabecalho">
        <p className="eyebrow">vendas</p>
        <h1 className="secao-titulo">Todos os pedidos</h1>
        <p className="secao-sub">
          Filtre por status e faixa de valor, ordene por data ou total e abra o cliente.
        </p>
      </div>

      <div className="filtros">
        <div className="campo">
          <label htmlFor="filtro-status">Status</label>
          <select
            id="filtro-status"
            value={status}
            onChange={(evento) => setStatus(evento.target.value as FiltroStatus)}
          >
            <option value="todos">Todos os status</option>
            <option value="aberto">{ROTULO_STATUS.aberto}</option>
            <option value="pago">{ROTULO_STATUS.pago}</option>
            <option value="cancelado">{ROTULO_STATUS.cancelado}</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtro-faixa">Faixa de valor</label>
          <select
            id="filtro-faixa"
            value={faixa}
            onChange={(evento) => setFaixa(evento.target.value as FaixaValor)}
          >
            {FAIXAS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="filtro-ordem">Ordenar por</label>
          <select
            id="filtro-ordem"
            value={ordem}
            onChange={(evento) => setOrdem(evento.target.value as OrdemPedidos)}
          >
            {ORDENS.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <Vazio titulo="Nenhum pedido cadastrado.">
          <p>Os pedidos nascem dentro do detalhe de cada cliente.</p>
          <Link className="btn btn-primario" to="/clientes">
            Ir para clientes
          </Link>
        </Vazio>
      ) : filtrados.length === 0 ? (
        <Vazio titulo="Nenhum pedido com esses filtros.">
          <p>Mude o status ou a faixa de valor para ver outros pedidos.</p>
          <button type="button" className="btn btn-secundario" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </Vazio>
      ) : (
        <>
          <div className="resumo-lista">
            <span>
              {numero(filtrados.length)} de {numero(pedidos.length)} pedidos
            </span>
            <span>
              Total na lista: <strong>{brl(totalFiltrado)}</strong>
            </span>
            {temFiltro && (
              <button type="button" className="btn btn-fantasma btn-pequeno" onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>

          <ul className="lista-pedidos-todos">
            {filtrados.map((pedido) => (
              <li key={pedido.id}>
                <Link className="pedido-linha" to={`/clientes/${pedido.clienteId}`}>
                  <div className="pedido-linha-principal">
                    <span className="pedido-cliente">
                      {nomePorCliente.get(pedido.clienteId) ?? `Cliente #${pedido.clienteId}`}
                    </span>
                    <span className="pedido-linha-detalhe">
                      Pedido #{pedido.id} · {pedido.itens.length} item(ns)
                    </span>
                  </div>
                  <span className="pedido-linha-data">{formatarData(pedido.criadoEm)}</span>
                  <StatusPedidoBadge status={pedido.status} />
                  <strong className="pedido-linha-total">{brl(totalDoPedido(pedido))}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
