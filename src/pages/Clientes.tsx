import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Carregando, Erro, Vazio } from '../components/Estados'
import SeloCliente from '../components/SeloCliente'
import { listarClientes } from '../services/clientes'
import { listarTodosPedidos } from '../services/pedidos'
import type { Cliente, Pedido } from '../types'
import { seloDoCliente, totalDoCliente } from '../utils/calculos'
import { mensagemDeErro } from '../utils/erros'
import { brl, numero } from '../utils/formato'

const TAMANHO_PAGINA = 5

export default function Clientes() {
  const [q, setQ] = useState('')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    document.title = 'Clientes · CRM de clientes'
  }, [])

  // Espera a pessoa parar de digitar antes de chamar a API.
  useEffect(() => {
    const alvo = q.trim()
    if (alvo === busca) return

    const timer = window.setTimeout(() => {
      setBusca(alvo)
      setPagina(1)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [q, busca])

  useEffect(() => {
    let ativo = true
    const skip = (pagina - 1) * TAMANHO_PAGINA
    setCarregando(true)
    setErro(null)

    Promise.all([
      listarClientes({ q: busca, limit: TAMANHO_PAGINA, skip }),
      listarTodosPedidos(),
    ])
      .then(([lista, todosOsPedidos]) => {
        if (!ativo) return

        const paginas = Math.max(1, Math.ceil(lista.total / TAMANHO_PAGINA))
        if (pagina > paginas) {
          setPagina(paginas)
          return
        }

        setClientes(lista.clientes)
        setTotal(lista.total)
        setPedidos(todosOsPedidos)
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
  }, [busca, pagina, recarregar])

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA))
  const inicio = total === 0 ? 0 : (pagina - 1) * TAMANHO_PAGINA + 1
  const fim = Math.min(pagina * TAMANHO_PAGINA, total)

  return (
    <section className="secao">
      <div className="secao-cabecalho secao-cabecalho-linha">
        <div>
          <p className="eyebrow">cadastro</p>
          <h1 className="secao-titulo">Clientes</h1>
          <p className="secao-sub">Busque por nome ou e-mail e abra o cliente para ver tudo.</p>
        </div>
        <Link className="btn btn-primario" to="/clientes/novo">
          + Novo cliente
        </Link>
      </div>

      <div className="barra-busca">
        <label htmlFor="busca-cliente">Buscar cliente</label>
        <div className="busca-campo">
          <input
            id="busca-cliente"
            type="search"
            value={q}
            placeholder="Nome ou e-mail"
            onChange={(evento) => setQ(evento.target.value)}
            autoComplete="off"
          />
          {q && (
            <button
              type="button"
              className="btn btn-fantasma btn-limpar"
              onClick={() => setQ('')}
              aria-label="Limpar busca"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {carregando && <Carregando titulo="Carregando clientes…" />}

      {!carregando && erro && (
        <Erro aoTentarDeNovo={() => setRecarregar((valor) => valor + 1)}>{erro}</Erro>
      )}

      {!carregando && !erro && clientes.length === 0 && (
        <Vazio
          titulo={busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
        >
          {busca ? (
            <>
              <p>
                Não achamos ninguém para <strong>“{busca}”</strong>. Tente outro nome ou e-mail.
              </p>
              <button type="button" className="btn btn-secundario" onClick={() => setQ('')}>
                Limpar busca
              </button>
            </>
          ) : (
            <>
              <p>Comece cadastrando o primeiro cliente da empresa.</p>
              <Link className="btn btn-primario" to="/clientes/novo">
                Cadastrar cliente
              </Link>
            </>
          )}
        </Vazio>
      )}

      {!carregando && !erro && clientes.length > 0 && (
        <>
          <ul className="lista-clientes">
            {clientes.map((cliente) => {
              const totalComprado = totalDoCliente(pedidos, cliente.id)
              const selo = seloDoCliente(totalComprado)

              return (
                <li key={cliente.id}>
                  <Link className="cliente-card" to={`/clientes/${cliente.id}`}>
                    <div className="cliente-card-principal">
                      <h2>{cliente.nome}</h2>
                      <p className="cliente-email">{cliente.email}</p>
                      <p className="cliente-detalhe">
                        {[cliente.empresa, cliente.cidade].filter(Boolean).join(' · ') ||
                          'Sem empresa/cidade'}
                      </p>
                    </div>

                    <div className="cliente-card-lado">
                      <SeloCliente selo={selo} />
                      <span className="cliente-total">{brl(totalComprado)}</span>
                      <span className="cliente-total-rotulo">em compras</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          <nav className="paginacao" aria-label="Paginação de clientes">
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
              disabled={pagina <= 1}
            >
              Anterior
            </button>

            <p className="paginacao-info">
              {numero(inicio)}–{numero(fim)} de {numero(total)} · página {pagina} de{' '}
              {totalPaginas}
            </p>

            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
              disabled={pagina >= totalPaginas}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </section>
  )
}
