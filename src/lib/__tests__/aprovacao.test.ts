import { describe, it, expect } from 'vitest'
import {
  bloqueiaHorario,
  podeCriarReserva,
  podeEditarReserva,
  proximoStatus,
  agruparDisputas,
  type PedidoDisputa,
} from '../business-rules'
import type { ApprovalStatus, Papel } from '@/types'

// Espelha AprovacaoRulesTest.java da reseva-api.

describe('bloqueiaHorario', () => {
  it('aprovada e cancelamento solicitado ocupam o horário', () => {
    expect(bloqueiaHorario('aprovada')).toBe(true)
    expect(bloqueiaHorario('cancelamento_solicitado')).toBe(true)
  })

  it('pendente, recusada e cancelada não ocupam', () => {
    expect(bloqueiaHorario('pendente')).toBe(false)
    expect(bloqueiaHorario('recusada')).toBe(false)
    expect(bloqueiaHorario('cancelada')).toBe(false)
  })
})

describe('podeCriarReserva', () => {
  it('só organizador e admin criam', () => {
    expect(podeCriarReserva('usuario')).toBe(false)
    expect(podeCriarReserva('organizador')).toBe(true)
    expect(podeCriarReserva('admin')).toBe(true)
  })
})

describe('podeEditarReserva', () => {
  it('organizador edita só a própria pendente', () => {
    expect(podeEditarReserva('pendente', 'organizador', true)).toBe(true)
    expect(podeEditarReserva('pendente', 'organizador', false)).toBe(false)
    expect(podeEditarReserva('aprovada', 'organizador', true)).toBe(false)
  })

  it('admin edita reservas ativas, não as encerradas', () => {
    expect(podeEditarReserva('aprovada', 'admin', false)).toBe(true)
    expect(podeEditarReserva('recusada', 'admin', false)).toBe(false)
    expect(podeEditarReserva('cancelada', 'admin', false)).toBe(false)
  })
})

describe('proximoStatus', () => {
  const p = (s: ApprovalStatus, a: Parameters<typeof proximoStatus>[1], papel: Papel, dono: boolean) =>
    proximoStatus(s, a, papel, dono)

  it('admin aprova e recusa pendente', () => {
    expect(p('pendente', 'aprovar', 'admin', false)).toBe('aprovada')
    expect(p('pendente', 'recusar', 'admin', false)).toBe('recusada')
    expect(p('recusada', 'aprovar', 'admin', false)).toBeNull()
  })

  it('organizador cancela pendente direto e pede cancelamento da aprovada', () => {
    expect(p('pendente', 'cancelar', 'organizador', true)).toBe('cancelada')
    expect(p('aprovada', 'cancelar', 'organizador', true)).toBe('cancelamento_solicitado')
    expect(p('cancelamento_solicitado', 'cancelar', 'organizador', true)).toBeNull()
  })

  it('organizador não mexe na reserva de outro nem aprova', () => {
    expect(p('pendente', 'cancelar', 'organizador', false)).toBeNull()
    expect(p('pendente', 'aprovar', 'organizador', true)).toBeNull()
  })

  it('admin decide o cancelamento', () => {
    expect(p('cancelamento_solicitado', 'aprovar_cancelamento', 'admin', false)).toBe('cancelada')
    expect(p('cancelamento_solicitado', 'recusar_cancelamento', 'admin', false)).toBe('aprovada')
  })
})

describe('agruparDisputas', () => {
  const pedido = (id: string, sala: string, data: string, inicio: string, fim: string, criado: string): PedidoDisputa => ({
    id, sala_id: sala, data, horario_inicio: inicio, horario_fim: fim, created_at: `2026-11-05T${criado}:00Z`,
  })

  it('pedidos que se sobrepõem ficam no mesmo grupo, em ordem de chegada', () => {
    const grupos = agruparDisputas([
      pedido('b', 'A', '2026-11-12', '15:00', '17:00', '15:40'),
      pedido('a', 'A', '2026-11-12', '14:00', '16:00', '09:12'),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('encadeia sobreposições (a com b, b com c) num grupo só', () => {
    const grupos = agruparDisputas([
      pedido('a', 'A', '2026-11-12', '08:00', '10:00', '09:00'),
      pedido('b', 'A', '2026-11-12', '09:30', '12:00', '09:01'),
      pedido('c', 'A', '2026-11-12', '11:00', '13:00', '09:02'),
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0]).toHaveLength(3)
  })

  it('outra sala, outro dia ou sem sobreposição ficam separados', () => {
    const grupos = agruparDisputas([
      pedido('a', 'A', '2026-11-12', '14:00', '16:00', '09:00'),
      pedido('b', 'B', '2026-11-12', '14:00', '16:00', '09:01'),
      pedido('c', 'A', '2026-11-13', '14:00', '16:00', '09:02'),
      pedido('d', 'A', '2026-11-12', '17:00', '18:00', '09:03'),
    ])
    expect(grupos).toHaveLength(4)
  })
})
