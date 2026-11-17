import { Outlet } from 'react-router-dom'
import Header from './Header'
import Rodape from './Rodape'

export default function Layout() {
  return (
    <div className="pagina">
      <Header />
      <main className="container">
        <Outlet />
      </main>
      <Rodape />
    </div>
  )
}
