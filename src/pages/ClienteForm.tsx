import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Carregando, Erro } from '../components/Estados'
import { atualizarCliente, buscarCliente, criarCliente } from '../services/clientes'
import type { DadosCliente } from '../types'
import { mensagemDeErro, statusDoErro } from '../utils/erros'
import { validarCliente, type ErrosCliente } from '../utils/validacao'

const VAZIO: DadosCliente = {
  nome: '',
  email: '',
  telefone: '',
  empresa: '',
  cidade: '',
}

export default function ClienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editando = id !== undefined
  const clienteId = Number(id)

  const [dados, setDados] = useState<DadosCliente>(VAZIO)
  const [erros, setErros] = useState<ErrosCliente>({})
  const [erro, setErro] = useState<string | null>(null)
  const [carregandoInicial, setCarregandoInicial] = useState(editando)
  const [erroInicial, setErroInicial] = useState<string | null>(null)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [recarregar, setRecarregar] = useState(0)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    document.title = editando ? 'Editar cliente · CRM' : 'Novo cliente · CRM'
  }, [editando])

  useEffect(() => {
    if (!editando) return
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      setCarregandoInicial(false)
      setNaoEncontrado(true)
      setErroInicial('Cliente não encontrado.')
      return
    }

    let ativo = true
    setCarregandoInicial(true)
    setErroInicial(null)
    setNaoEncontrado(false)

    buscarCliente(clienteId)
      .then((cliente) => {
        if (!ativo) return
        setDados({
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          empresa: cliente.empresa,
          cidade: cliente.cidade,
        })
      })
      .catch((err: unknown) => {
        if (!ativo) return
        if (statusDoErro(err) === 404) {
          setNaoEncontrado(true)
          setErroInicial('Cliente não encontrado.')
        } else {
          setErroInicial(mensagemDeErro(err))
        }
      })
      .finally(() => {
        if (ativo) setCarregandoInicial(false)
      })

    return () => {
      ativo = false
    }
  }, [editando, clienteId, recarregar])

  function alterar(campo: keyof DadosCliente, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => {
      if (!atuais[campo] && !atuais.geral) return atuais
      const proximos = { ...atuais }
      delete proximos[campo]
      delete proximos.geral
      return proximos
    })
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)

    const novosErros = validarCliente(dados)
    setErros(novosErros)
    if (Object.keys(novosErros).length > 0) return

    setSalvando(true)
    try {
      if (editando) {
        await atualizarCliente(clienteId, dados)
        navigate(`/clientes/${clienteId}`, { replace: true })
      } else {
        const novo = await criarCliente(dados)
        navigate(novo.id > 0 ? `/clientes/${novo.id}` : '/clientes', { replace: true })
      }
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setSalvando(false)
    }
  }

  if (carregandoInicial) return <Carregando titulo="Carregando cliente…" />

  if (erroInicial) {
    return (
      <Erro
        titulo={naoEncontrado ? 'Cliente não encontrado.' : 'Não foi possível carregar o cliente.'}
        aoTentarDeNovo={
          naoEncontrado ? undefined : () => setRecarregar((valor) => valor + 1)
        }
      >
        <p>{erroInicial}</p>
        <Link className="btn btn-secundario" to="/clientes">
          Voltar para a lista
        </Link>
      </Erro>
    )
  }

  return (
    <section className="secao secao-estreita">
      <div className="secao-cabecalho">
        <p className="eyebrow">{editando ? 'editar' : 'cadastrar'}</p>
        <h1 className="secao-titulo">{editando ? 'Editar cliente' : 'Novo cliente'}</h1>
        <p className="secao-sub">
          Nome e e-mail são obrigatórios. Preencha também pelo menos 2 entre telefone,
          empresa e cidade.
        </p>
      </div>

      <form className="formulario" onSubmit={salvar} noValidate>
        {erro && (
          <p className="aviso aviso-erro" role="alert">
            {erro}
          </p>
        )}

        {erros.geral && (
          <p className="aviso aviso-erro" role="alert">
            {erros.geral}
          </p>
        )}

        <div className="campo">
          <label htmlFor="nome">
            Nome <span aria-hidden="true">*</span>
          </label>
          <input
            id="nome"
            name="nome"
            value={dados.nome}
            onChange={(evento) => alterar('nome', evento.target.value)}
            aria-invalid={erros.nome !== undefined}
            aria-describedby={erros.nome ? 'erro-nome' : undefined}
            disabled={salvando}
            required
          />
          {erros.nome && (
            <p className="erro-campo" id="erro-nome">
              {erros.nome}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor="email">
            E-mail <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={dados.email}
            onChange={(evento) => alterar('email', evento.target.value)}
            aria-invalid={erros.email !== undefined}
            aria-describedby={erros.email ? 'erro-email' : undefined}
            disabled={salvando}
            autoComplete="email"
            required
          />
          {erros.email && (
            <p className="erro-campo" id="erro-email">
              {erros.email}
            </p>
          )}
        </div>

        <div className="campo">
          <label htmlFor="telefone">Telefone</label>
          <input
            id="telefone"
            name="telefone"
            type="tel"
            value={dados.telefone}
            onChange={(evento) => alterar('telefone', evento.target.value)}
            disabled={salvando}
            autoComplete="tel"
            placeholder="(21) 99999-0000"
          />
        </div>

        <div className="campo">
          <label htmlFor="empresa">Empresa</label>
          <input
            id="empresa"
            name="empresa"
            value={dados.empresa}
            onChange={(evento) => alterar('empresa', evento.target.value)}
            disabled={salvando}
            autoComplete="organization"
          />
        </div>

        <div className="campo">
          <label htmlFor="cidade">Cidade</label>
          <input
            id="cidade"
            name="cidade"
            value={dados.cidade}
            onChange={(evento) => alterar('cidade', evento.target.value)}
            disabled={salvando}
            autoComplete="address-level2"
          />
        </div>

        <div className="formulario-acoes">
          <button type="submit" className="btn btn-primario" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar cliente'}
          </button>
          <Link
            className="btn btn-secundario"
            to={editando ? `/clientes/${clienteId}` : '/clientes'}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </section>
  )
}
