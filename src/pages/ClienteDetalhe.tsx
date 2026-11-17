import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AtendimentosDoCliente from '../components/AtendimentosDoCliente'
import { Carregando, Erro } from '../components/Estados'
import PedidosDoCliente from '../components/PedidosDoCliente'
import SeloCliente from '../components/SeloCliente'
import { buscarCliente, excluirCliente } from '../services/clientes'
import { listarAtendimentosDoCliente } from '../services/atendimentos'
import { listarPedidosDoCliente } from '../services/pedidos'
import type { Atendimento, Cliente, Pedido } from '../types'
import { seloDoCliente, totalDoCliente } from '../utils/calculos'
import { mensagemDeErro, statusDoErro } from '../utils/erros'
import { brl, formatarData } from '../utils/formato'

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const clienteId = Number(id)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    document.title = 'Cliente · CRM de clientes'
  }, [])

  useEffect(() => {
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      setNaoEncontrado(true)
      setCarregando(false)
      return
    }

    let ativo = true
    setCarregando(true)
    setErro(null)
    setNaoEncontrado(false)
    setErroExclusao(null)

    Promise.all([
      buscarCliente(clienteId),
      listarPedidosDoCliente(clienteId),
      listarAtendimentosDoCliente(clienteId),
    ])
      .then(([dadosCliente, listaPedidos, listaAtendimentos]) => {
        if (!ativo) return
        setCliente(dadosCliente)
        setPedidos(listaPedidos)
        setAtendimentos(listaAtendimentos)
        document.title = `${dadosCliente.nome} · CRM de clientes`
      })
      .catch((err: unknown) => {
        if (!ativo) return
        if (statusDoErro(err) === 404) setNaoEncontrado(true)
        else setErro(mensagemDeErro(err))
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [clienteId, recarregar])

  async function excluir() {
    if (!cliente) return

    const pedidosTexto = `${pedidos.length} pedido(s)`
    const atendimentosTexto = `${atendimentos.length} atendimento(s)`
    const confirmou = window.confirm(
      `Excluir “${cliente.nome}”?\n\nIsso apaga ${pedidosTexto} e ${atendimentosTexto} junto.`,
    )
    if (!confirmou) return

    setErroExclusao(null)
    setExcluindo(true)
    try {
      await excluirCliente(cliente.id)
      navigate('/clientes', { replace: true })
    } catch (err) {
      setErroExclusao(mensagemDeErro(err))
      setExcluindo(false)
    }
  }

  if (carregando) return <Carregando titulo="Carregando cliente…" />

  if (naoEncontrado) {
    return (
      <section className="secao secao-estreita">
        <div className="estado estado-erro">
          <p className="estado-titulo">Cliente não encontrado.</p>
          <p className="estado-texto">
            O cliente #{id} não existe ou foi excluído.
          </p>
          <Link className="btn btn-primario" to="/clientes">
            Voltar para a lista
          </Link>
        </div>
      </section>
    )
  }

  if (erro || !cliente) {
    return (
      <Erro aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)}>
        {erro ?? 'Não foi possível carregar o cliente.'}
      </Erro>
    )
  }

  const totalComprado = totalDoCliente(pedidos, cliente.id)
  const selo = seloDoCliente(totalComprado)
  const inicial = cliente.nome.trim().charAt(0).toUpperCase() || '?'

  return (
    <section className="secao">
      <nav className="migalhas" aria-label="Você está em">
        <Link to="/clientes">Clientes</Link>
        <span aria-hidden="true">/</span>
        <span>{cliente.nome}</span>
      </nav>

      <header className="cliente-topo">
        <div className="cliente-identidade">
          <span className="avatar" aria-hidden="true">
            {inicial}
          </span>
          <div>
            <div className="cliente-nome-linha">
              <h1 className="secao-titulo">{cliente.nome}</h1>
              <SeloCliente selo={selo} />
            </div>
            <p className="secao-sub">
              {cliente.email} · {brl(totalComprado)} em compras
            </p>
          </div>
        </div>

        <div className="cliente-acoes">
          <Link className="btn btn-secundario" to={`/clientes/${cliente.id}/editar`}>
            Editar
          </Link>
          <button
            type="button"
            className="btn btn-perigo"
            onClick={excluir}
            disabled={excluindo}
          >
            {excluindo ? 'Excluindo…' : 'Excluir cliente'}
          </button>
        </div>
      </header>

      {erroExclusao && (
        <p className="aviso aviso-erro" role="alert">
          {erroExclusao}
        </p>
      )}

      <article className="bloco">
        <div className="bloco-cabecalho">
          <h2>Dados do cliente</h2>
          {cliente.criadoEm && (
            <span className="bloco-nota">
              Cliente desde {formatarData(cliente.criadoEm)}
            </span>
          )}
        </div>

        <dl className="dados-cliente">
          <div>
            <dt>E-mail</dt>
            <dd>
              {cliente.email ? (
                <a href={`mailto:${cliente.email}`}>{cliente.email}</a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>
              {cliente.telefone ? (
                <a href={`tel:${cliente.telefone.replace(/[^\d+]/g, '')}`}>
                  {cliente.telefone}
                </a>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{cliente.empresa || '—'}</dd>
          </div>
          <div>
            <dt>Cidade</dt>
            <dd>{cliente.cidade || '—'}</dd>
          </div>
        </dl>
      </article>

      <PedidosDoCliente
        clienteId={cliente.id}
        pedidos={pedidos}
        aoMudarPedidos={setPedidos}
      />

      <AtendimentosDoCliente
        clienteId={cliente.id}
        atendimentos={atendimentos}
        aoMudarAtendimentos={setAtendimentos}
      />
    </section>
  )
}
