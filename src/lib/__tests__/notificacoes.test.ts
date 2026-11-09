import { describe, it, expect } from 'vitest'
import { linkDaNotificacao } from '../notificacoes'

describe('linkDaNotificacao', () => {
  it('pedido novo abre a fila de pedidos do admin com destaque', () => {
    expect(linkDaNotificacao({ tipo: 'pedido_novo', reserva_id: 'r1' })).toBe('/pedidos?destaque=r1')
  })

  it('cancelamento solicitado abre a aba de cancelamentos', () => {
    expect(linkDaNotificacao({ tipo: 'cancelamento_solicitado', reserva_id: 'r1' }))
      .toBe('/pedidos?aba=cancelamentos&destaque=r1')
  })

  it('respostas ao organizador abrem as reservas dele', () => {
    expect(linkDaNotificacao({ tipo: 'pedido_aprovado', reserva_id: 'r1' })).toBe('/reservas?destaque=r1')
    expect(linkDaNotificacao({ tipo: 'pedido_recusado', reserva_id: 'r1' })).toBe('/reservas?destaque=r1')
  })

  it('reserva já apagada abre a lista sem destaque', () => {
    expect(linkDaNotificacao({ tipo: 'pedido_aprovado' })).toBe('/reservas')
  })

  it('falha de email abre a seção de emails do perfil', () => {
    expect(linkDaNotificacao({ tipo: 'email_falhou' })).toBe('/perfil#emails')
  })
})
