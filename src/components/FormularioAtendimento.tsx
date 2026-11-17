import { useState, type FormEvent } from 'react'
import type { DadosAtendimento } from '../types'
import { mensagemDeErro } from '../utils/erros'
import { CANAIS } from '../utils/rotulos'
import { validarAtendimento } from '../utils/validacao'

type Props = {
  inicial?: DadosAtendimento
  rotuloBotao: string
  aoSalvar: (dados: DadosAtendimento) => Promise<void>
  aoCancelar: () => void
  idPrefixo: string
}

const VAZIO: DadosAtendimento = {
  titulo: '',
  texto: '',
  canal: 'telefone',
}

/** Formulário controlado, usado para criar e para editar um atendimento. */
export default function FormularioAtendimento({
  inicial,
  rotuloBotao,
  aoSalvar,
  aoCancelar,
  idPrefixo,
}: Props) {
  const [dados, setDados] = useState<DadosAtendimento>(inicial ?? VAZIO)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro(null)

    const erroValidacao = validarAtendimento(dados)
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    setEnviando(true)
    try {
      await aoSalvar(dados)
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario-bloco" onSubmit={salvar} noValidate>
      <div className="campo">
        <label htmlFor={`${idPrefixo}-titulo`}>Título</label>
        <input
          id={`${idPrefixo}-titulo`}
          value={dados.titulo}
          onChange={(evento) =>
            setDados((atual) => ({ ...atual, titulo: evento.target.value }))
          }
          disabled={enviando}
          placeholder="Ex.: Ligação sobre a proposta"
        />
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-texto`}>Texto</label>
        <textarea
          id={`${idPrefixo}-texto`}
          value={dados.texto}
          onChange={(evento) =>
            setDados((atual) => ({ ...atual, texto: evento.target.value }))
          }
          disabled={enviando}
          rows={4}
          placeholder="O que foi conversado?"
        />
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-canal`}>Canal</label>
        <select
          id={`${idPrefixo}-canal`}
          value={dados.canal}
          onChange={(evento) =>
            setDados((atual) => ({
              ...atual,
              canal: evento.target.value as DadosAtendimento['canal'],
            }))
          }
          disabled={enviando}
        >
          {CANAIS.map((canal) => (
            <option key={canal.valor} value={canal.valor}>
              {canal.rotulo}
            </option>
          ))}
        </select>
      </div>

      {erro && (
        <p className="aviso aviso-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="formulario-acoes">
        <button type="submit" className="btn btn-primario btn-pequeno" disabled={enviando}>
          {enviando ? 'Salvando…' : rotuloBotao}
        </button>
        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={aoCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
