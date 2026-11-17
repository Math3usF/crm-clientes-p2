import { useState } from 'react'
import {
  atualizarAtendimento,
  criarAtendimento,
  excluirAtendimento,
  listarAtendimentosDoCliente,
} from '../services/atendimentos'
import type { Atendimento, DadosAtendimento, Id } from '../types'
import {
  filtrarAtendimentos,
  ordenarAtendimentos,
  type FiltroCanal,
} from '../utils/calculos'
import { mensagemDeErro } from '../utils/erros'
import { formatarDataHora } from '../utils/formato'
import { CANAIS, ROTULO_CANAL } from '../utils/rotulos'
import FormularioAtendimento from './FormularioAtendimento'

type Props = {
  clienteId: Id
  atendimentos: Atendimento[]
  aoMudarAtendimentos: (atendimentos: Atendimento[]) => void
}

export default function AtendimentosDoCliente({
  clienteId,
  atendimentos,
  aoMudarAtendimentos,
}: Props) {
  const [filtro, setFiltro] = useState<FiltroCanal>('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<Id | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupadoId, setOcupadoId] = useState<Id | null>(null)

  const visiveis = ordenarAtendimentos(filtrarAtendimentos(atendimentos, filtro))

  async function recarregar() {
    const lista = await listarAtendimentosDoCliente(clienteId)
    aoMudarAtendimentos(lista)
  }

  async function criar(dados: DadosAtendimento) {
    await criarAtendimento(clienteId, dados)
    await recarregar()
    setMostrarForm(false)
    setAviso('Atendimento registrado.')
  }

  async function editar(id: Id, dados: DadosAtendimento) {
    await atualizarAtendimento(id, dados)
    await recarregar()
    setEditandoId(null)
    setAviso('Atendimento atualizado.')
  }

  async function excluir(atendimento: Atendimento) {
    const confirmou = window.confirm(`Excluir o atendimento “${atendimento.titulo}”?`)
    if (!confirmou) return

    setErro(null)
    setAviso(null)
    setOcupadoId(atendimento.id)

    try {
      await excluirAtendimento(atendimento.id)
      await recarregar()
      if (editandoId === atendimento.id) setEditandoId(null)
      setAviso('Atendimento excluído.')
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setOcupadoId(null)
    }
  }

  return (
    <section className="bloco" aria-labelledby="titulo-atendimentos">
      <div className="bloco-cabecalho">
        <div>
          <h2 id="titulo-atendimentos">Histórico de atendimento</h2>
          <p className="bloco-sub">
            {visiveis.length} atendimento(s) · do mais recente para o mais antigo
          </p>
        </div>

        {!mostrarForm && (
          <button
            type="button"
            className="btn btn-primario btn-pequeno"
            onClick={() => {
              setMostrarForm(true)
              setAviso(null)
            }}
          >
            + Novo atendimento
          </button>
        )}
      </div>

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {aviso && (
        <p className="aviso aviso-ok" role="status">
          {aviso}
        </p>
      )}

      {mostrarForm && (
        <>
          <h3 className="subtitulo">Novo atendimento</h3>
          <FormularioAtendimento
            rotuloBotao="Registrar atendimento"
            aoSalvar={criar}
            aoCancelar={() => setMostrarForm(false)}
            idPrefixo="novo-atendimento"
          />
        </>
      )}

      <div className="filtro-canal">
        <label htmlFor="filtro-canal">Filtrar por canal</label>
        <select
          id="filtro-canal"
          value={filtro}
          onChange={(evento) => setFiltro(evento.target.value as FiltroCanal)}
        >
          <option value="todos">Todos os canais</option>
          {CANAIS.map((canal) => (
            <option key={canal.valor} value={canal.valor}>
              {canal.rotulo}
            </option>
          ))}
        </select>
        <span className="contador-atendimentos" aria-live="polite">
          {visiveis.length} atendimento(s)
        </span>
      </div>

      {atendimentos.length === 0 && !mostrarForm ? (
        <div className="estado estado-vazio">
          <p className="estado-titulo">Nenhum atendimento registrado.</p>
          <p className="estado-texto">Registre a primeira ligação, e-mail ou conversa.</p>
          <button type="button" className="btn btn-primario" onClick={() => setMostrarForm(true)}>
            + Novo atendimento
          </button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="estado estado-vazio">
          <p className="estado-titulo">Nenhum atendimento nesse canal.</p>
          <button type="button" className="btn btn-secundario" onClick={() => setFiltro('todos')}>
            Ver todos os canais
          </button>
        </div>
      ) : (
        <ul className="lista-atendimentos">
          {visiveis.map((atendimento) => {
            const editando = editandoId === atendimento.id
            const ocupado = ocupadoId === atendimento.id

            return (
              <li key={atendimento.id} className="atendimento-card">
                {editando ? (
                  <>
                    <h3 className="subtitulo">Editar atendimento</h3>
                    <FormularioAtendimento
                      inicial={{
                        titulo: atendimento.titulo,
                        texto: atendimento.texto,
                        canal: atendimento.canal,
                      }}
                      rotuloBotao="Salvar atendimento"
                      aoSalvar={(dados) => editar(atendimento.id, dados)}
                      aoCancelar={() => setEditandoId(null)}
                      idPrefixo={`editar-atendimento-${atendimento.id}`}
                    />
                  </>
                ) : (
                  <>
                    <div className="atendimento-cabecalho">
                      <div>
                        <p className="atendimento-titulo">{atendimento.titulo}</p>
                        <p className="atendimento-data">
                          {formatarDataHora(atendimento.criadoEm)}
                        </p>
                      </div>
                      <span className={`canal canal-${atendimento.canal}`}>
                        {ROTULO_CANAL[atendimento.canal]}
                      </span>
                    </div>

                    <p className="atendimento-texto">{atendimento.texto}</p>

                    <div className="atendimento-acoes">
                      <button
                        type="button"
                        className="btn btn-secundario btn-pequeno"
                        onClick={() => {
                          setEditandoId(atendimento.id)
                          setErro(null)
                          setAviso(null)
                        }}
                        disabled={ocupado}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-perigo-fantasma btn-pequeno"
                        onClick={() => excluir(atendimento)}
                        disabled={ocupado}
                      >
                        {ocupado ? 'Excluindo…' : 'Excluir'}
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
