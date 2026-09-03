import { describe, it, expect } from 'vitest'
import {
  intervalsConflict,
  hasTimeConflict,
  isWeekend,
  isMadrugada,
  exceedsCapacity,
} from '../business-rules'

// ---------------------------------------------------------------------------
// Regra 1 — Conflito de horário
// ---------------------------------------------------------------------------

describe('intervalsConflict', () => {
  it('detecta sobreposição parcial (nova começa no meio da existente)', () => {
    expect(intervalsConflict(
      { horario_inicio: '14:00', horario_fim: '16:00' },
      { horario_inicio: '13:00', horario_fim: '15:00' }
    )).toBe(true)
  })

  it('detecta sobreposição parcial (nova termina no meio da existente)', () => {
    expect(intervalsConflict(
      { horario_inicio: '09:00', horario_fim: '11:00' },
      { horario_inicio: '10:00', horario_fim: '12:00' }
    )).toBe(true)
  })

  it('detecta quando nova reserva contém a existente', () => {
    expect(intervalsConflict(
      { horario_inicio: '08:00', horario_fim: '18:00' },
      { horario_inicio: '10:00', horario_fim: '12:00' }
    )).toBe(true)
  })

  it('detecta quando nova reserva está contida na existente', () => {
    expect(intervalsConflict(
      { horario_inicio: '10:00', horario_fim: '11:00' },
      { horario_inicio: '09:00', horario_fim: '12:00' }
    )).toBe(true)
  })

  it('reservas que encostam SÃO conflito (14h-15h toca 15h-16h)', () => {
    expect(intervalsConflict(
      { horario_inicio: '15:00', horario_fim: '16:00' },
      { horario_inicio: '14:00', horario_fim: '15:00' }
    )).toBe(true)
  })

  it('reservas que encostam SÃO conflito (sentido inverso)', () => {
    expect(intervalsConflict(
      { horario_inicio: '14:00', horario_fim: '15:00' },
      { horario_inicio: '15:00', horario_fim: '16:00' }
    )).toBe(true)
  })

  it('reservas idênticas são conflito', () => {
    expect(intervalsConflict(
      { horario_inicio: '10:00', horario_fim: '11:00' },
      { horario_inicio: '10:00', horario_fim: '11:00' }
    )).toBe(true)
  })

  it('reservas sem sobreposição NÃO são conflito (nova antes da existente)', () => {
    expect(intervalsConflict(
      { horario_inicio: '08:00', horario_fim: '10:00' },
      { horario_inicio: '11:00', horario_fim: '13:00' }
    )).toBe(false)
  })

  it('reservas sem sobreposição NÃO são conflito (nova depois da existente)', () => {
    expect(intervalsConflict(
      { horario_inicio: '14:00', horario_fim: '16:00' },
      { horario_inicio: '10:00', horario_fim: '12:00' }
    )).toBe(false)
  })
})

describe('hasTimeConflict', () => {
  const existingReservations = [
    { horario_inicio: '09:00', horario_fim: '10:00' },
    { horario_inicio: '14:00', horario_fim: '15:30' },
  ]

  it('retorna true quando conflita com uma das reservas existentes', () => {
    expect(hasTimeConflict('09:30', '10:30', existingReservations)).toBe(true)
  })

  it('retorna true quando encosta em uma das reservas existentes', () => {
    expect(hasTimeConflict('10:00', '11:00', existingReservations)).toBe(true)
  })

  it('retorna false quando não há sobreposição com nenhuma reserva', () => {
    expect(hasTimeConflict('10:30', '13:30', existingReservations)).toBe(false)
  })

  it('retorna false quando a lista de reservas está vazia', () => {
    expect(hasTimeConflict('10:00', '11:00', [])).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Regra 2 — Capacidade
// ---------------------------------------------------------------------------

describe('exceedsCapacity', () => {
  it('retorna true quando participantes excedem a capacidade', () => {
    expect(exceedsCapacity(11, 10)).toBe(true)
  })

  it('retorna false quando participantes são iguais à capacidade (limite exato)', () => {
    expect(exceedsCapacity(10, 10)).toBe(false)
  })

  it('retorna false quando participantes são menores que a capacidade', () => {
    expect(exceedsCapacity(5, 10)).toBe(false)
  })

  it('retorna true para 1 participante acima da capacidade', () => {
    expect(exceedsCapacity(101, 100)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Disponibilidade — Madrugada
// ---------------------------------------------------------------------------

describe('isMadrugada', () => {
  it('retorna true para horário antes de 07:00', () => {
    expect(isMadrugada('06:59')).toBe(true)
  })

  it('retorna true para meia-noite (00:00)', () => {
    expect(isMadrugada('00:00')).toBe(true)
  })

  it('retorna true para 02:30', () => {
    expect(isMadrugada('02:30')).toBe(true)
  })

  // it('retorna false exatamente em 07:00 (horário de abertura padrão)', () => {
  //   expect(isMadrugada('07:00')).toBe(false)
  // })

  it('retorna false para horário após 07:00', () => {
    expect(isMadrugada('08:00')).toBe(false)
  })

  it('retorna false para horário comercial', () => {
    expect(isMadrugada('14:00')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Disponibilidade — Fim de semana
// ---------------------------------------------------------------------------

describe('isWeekend', () => {
  it('retorna true para sábado', () => {
    expect(isWeekend('2026-06-20')).toBe(true) // sábado
  })

  it('retorna true para domingo', () => {
    expect(isWeekend('2026-06-21')).toBe(true) // domingo
  })

  it('retorna false para segunda-feira', () => {
    expect(isWeekend('2026-06-22')).toBe(false) // segunda
  })

  it('retorna false para terça-feira', () => {
    expect(isWeekend('2026-06-23')).toBe(false) // terça
  })

  it('retorna false para quarta-feira', () => {
    expect(isWeekend('2026-06-24')).toBe(false) // quarta
  })

  it('retorna false para quinta-feira', () => {
    expect(isWeekend('2026-06-25')).toBe(false) // quinta
  })

  it('retorna false para sexta-feira', () => {
    expect(isWeekend('2026-06-26')).toBe(false) // sexta
  })
})
