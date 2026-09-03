const HORA_ABERTURA = '08:00'

export interface TimeInterval {
  horario_inicio: string // HH:MM
  horario_fim: string    // HH:MM
}

/**
 * Verifica se dois intervalos de tempo se conflitam.
 * Usa desigualdade não-estrita: reservas que se encostam (14h-15h e 15h-16h) SÃO conflito.
 */
export function intervalsConflict(a: TimeInterval, b: TimeInterval): boolean {
  return a.horario_inicio <= b.horario_fim && a.horario_fim >= b.horario_inicio
}

/**
 * Verifica se um novo horário conflita com qualquer reserva existente.
 * As strings de horário devem estar no formato HH:MM.
 */
export function hasTimeConflict(
  horario_inicio: string,
  horario_fim: string,
  existing: TimeInterval[]
): boolean {
  return existing.some((r) =>
    intervalsConflict({ horario_inicio, horario_fim }, r)
  )
}

/**
 * Verifica se uma data (YYYY-MM-DD) cai em fim de semana.
 * Usa T12:00:00 para evitar problemas de timezone UTC.
 */
export function isWeekend(data: string): boolean {
  const day = new Date(data + 'T12:00:00').getDay()
  return day === 0 || day === 6
}

/**
 * Verifica se um horário está na madrugada (antes de HORA_ABERTURA = 07:00).
 */
export function isMadrugada(horario_inicio: string): boolean {
  return horario_inicio < HORA_ABERTURA
}

/**
 * Verifica se a quantidade de participantes ultrapassa a capacidade da sala.
 */
export function exceedsCapacity(
  quantidade_participantes: number,
  capacidade: number
): boolean {
  return quantidade_participantes > capacidade
}
