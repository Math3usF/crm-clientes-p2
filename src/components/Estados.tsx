import type { ReactNode } from 'react'

type Props = {
  titulo?: string
  children?: ReactNode
  aoTentarDeNovo?: () => void
}

export function Carregando({ titulo = 'Carregando…' }: Props) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="estado-spinner" aria-hidden="true" />
      <p className="estado-titulo">{titulo}</p>
    </div>
  )
}

export function Erro({ titulo = 'Não deu para carregar.', children, aoTentarDeNovo }: Props) {
  return (
    <div className="estado estado-erro" role="alert">
      <p className="estado-titulo">{titulo}</p>
      {children && <div className="estado-texto">{children}</div>}
      {aoTentarDeNovo && (
        <button type="button" className="btn btn-primario" onClick={aoTentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Vazio({ titulo, children }: Props) {
  return (
    <div className="estado estado-vazio">
      <p className="estado-titulo">{titulo ?? 'Nada por aqui.'}</p>
      {children && <div className="estado-texto">{children}</div>}
    </div>
  )
}
