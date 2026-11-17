import { api } from './http'
import { registro, texto } from './normalizar'
import type { Usuario } from '../types'

export type RespostaLogin = {
  accessToken: string
  usuario: Usuario
}

function usuarioDe(valor: unknown, usernameDeReserva: string): Usuario {
  const objeto = registro(valor)
  const nome =
    texto(objeto.nome ?? objeto.name) ||
    [texto(objeto.firstName), texto(objeto.lastName)].filter(Boolean).join(' ')
  const id = Number(texto(objeto.id) || objeto.id)

  return {
    id: Number.isFinite(id) && id > 0 ? id : undefined,
    username: texto(objeto.username) || usernameDeReserva,
    nome: nome.trim() || undefined,
    firstName: texto(objeto.firstName) || undefined,
    lastName: texto(objeto.lastName) || undefined,
    email: texto(objeto.email) || undefined,
  }
}

/** POST /auth/login → accessToken + dados de quem entrou. */
export async function login(username: string, senha: string): Promise<RespostaLogin> {
  const { data } = await api.post('/auth/login', {
    username: username.trim(),
    password: senha,
  })

  const objeto = registro(data)
  const accessToken = texto(objeto.accessToken) || texto(objeto.token)

  if (!accessToken) {
    throw new Error('O login não devolveu um token. Confira se o servidor está atualizado.')
  }

  return {
    accessToken,
    usuario: usuarioDe(objeto.usuario ?? objeto.user ?? objeto, username.trim()),
  }
}

/** GET /auth/me → quem é o dono do token guardado. */
export async function me(): Promise<Usuario> {
  const { data } = await api.get('/auth/me')
  const objeto = registro(data)
  return usuarioDe(objeto.usuario ?? objeto.user ?? objeto, texto(objeto.username))
}
