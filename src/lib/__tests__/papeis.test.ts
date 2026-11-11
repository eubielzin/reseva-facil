import { describe, it, expect } from 'vitest'
import { homeDoPapel, redirecionamentoDoPapel } from '../papeis'

describe('homeDoPapel', () => {
  it('cada papel tem a sua tela inicial', () => {
    expect(homeDoPapel('admin')).toBe('/')
    expect(homeDoPapel('organizador')).toBe('/reservas')
    expect(homeDoPapel('usuario')).toBe('/eventos')
  })
})

describe('redirecionamentoDoPapel', () => {
  it('admin acessa tudo', () => {
    expect(redirecionamentoDoPapel('admin', '/pedidos')).toBeNull()
    expect(redirecionamentoDoPapel('admin', '/')).toBeNull()
  })

  it('organizador não vê o painel do admin nem os pedidos', () => {
    expect(redirecionamentoDoPapel('organizador', '/')).toBe('/reservas')
    expect(redirecionamentoDoPapel('organizador', '/pedidos')).toBe('/reservas')
    expect(redirecionamentoDoPapel('organizador', '/reservas')).toBeNull()
    expect(redirecionamentoDoPapel('organizador', '/salas')).toBeNull()
  })

  it('usuário comum vê eventos, ingressos e perfil', () => {
    expect(redirecionamentoDoPapel('usuario', '/reservas')).toBe('/eventos')
    expect(redirecionamentoDoPapel('usuario', '/')).toBe('/eventos')
    expect(redirecionamentoDoPapel('usuario', '/pedidos')).toBe('/eventos')
    expect(redirecionamentoDoPapel('usuario', '/perfil')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/bem-vindo')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/eventos')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/eventos/convite/K7QP2XABCD')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/ingressos')).toBeNull()
  })

  it('qualquer papel abre o leitor do evento (a API decide se é colaborador)', () => {
    expect(redirecionamentoDoPapel('usuario', '/eventos/e1/checkin')).toBeNull()
    expect(redirecionamentoDoPapel('organizador', '/eventos/e1/checkin')).toBeNull()
  })

  it('painel do evento é área do organizador', () => {
    expect(redirecionamentoDoPapel('organizador', '/reservas/r1/evento')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/reservas/r1/evento')).toBe('/eventos')
  })

  it('organizador também participa de eventos', () => {
    expect(redirecionamentoDoPapel('organizador', '/eventos')).toBeNull()
    expect(redirecionamentoDoPapel('organizador', '/ingressos')).toBeNull()
  })
})
