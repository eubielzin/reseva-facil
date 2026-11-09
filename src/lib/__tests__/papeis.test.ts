import { describe, it, expect } from 'vitest'
import { homeDoPapel, redirecionamentoDoPapel } from '../papeis'

describe('homeDoPapel', () => {
  it('cada papel tem a sua tela inicial', () => {
    expect(homeDoPapel('admin')).toBe('/')
    expect(homeDoPapel('organizador')).toBe('/reservas')
    expect(homeDoPapel('usuario')).toBe('/perfil')
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

  it('usuário comum só vê o perfil', () => {
    expect(redirecionamentoDoPapel('usuario', '/reservas')).toBe('/perfil')
    expect(redirecionamentoDoPapel('usuario', '/')).toBe('/perfil')
    expect(redirecionamentoDoPapel('usuario', '/perfil')).toBeNull()
    expect(redirecionamentoDoPapel('usuario', '/bem-vindo')).toBeNull()
  })
})
