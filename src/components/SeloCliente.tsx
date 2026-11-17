import type { Selo } from '../types'

const CLASSE: Record<Selo, string> = {
  VIP: 'selo selo-vip',
  Regular: 'selo selo-regular',
  'Sem compras': 'selo selo-sem-compras',
}

export default function SeloCliente({ selo }: { selo: Selo }) {
  return (
    <span className={CLASSE[selo]} title={`Selo do cliente: ${selo}`}>
      {selo}
    </span>
  )
}
