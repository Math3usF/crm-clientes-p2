import type { StatusPedido } from '../types'
import { ROTULO_STATUS } from '../utils/rotulos'

export default function StatusPedidoBadge({ status }: { status: StatusPedido }) {
  return <span className={`status status-${status}`}>{ROTULO_STATUS[status]}</span>
}
