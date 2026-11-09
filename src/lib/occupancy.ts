import { format } from 'date-fns'
import type { Ocupacao, Room } from '@/types'

type Interval = Pick<Ocupacao, 'sala_id' | 'data' | 'horario_inicio' | 'horario_fim'>

export type RoomNow =
  | { kind: 'em_uso'; ate: string }
  | { kind: 'livre'; ate: string | null } // ate = início da próxima reserva de hoje

export function todayString(now = new Date()): string {
  return format(now, 'yyyy-MM-dd')
}

export function nowString(now = new Date()): string {
  return format(now, 'HH:mm')
}

/** Reservas de uma data, ordenadas por horário de início. */
export function reservationsOn<T extends Interval>(data: string, reservations: T[]): T[] {
  return reservations
    .filter((r) => r.data === data)
    .sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
}

/** Situação da sala neste minuto, a partir das reservas de hoje (já ordenadas). */
export function roomNow(roomId: string, todays: Interval[], now: string): RoomNow {
  const daSala = todays.filter((r) => r.sala_id === roomId)
  const atual = daSala.find((r) => r.horario_inicio.slice(0, 5) <= now && now < r.horario_fim.slice(0, 5))
  if (atual) return { kind: 'em_uso', ate: atual.horario_fim.slice(0, 5) }
  const proxima = daSala.find((r) => r.horario_inicio.slice(0, 5) > now)
  return { kind: 'livre', ate: proxima ? proxima.horario_inicio.slice(0, 5) : null }
}

/** Horário em que a sala aceita reservas, nas palavras de quem reserva. */
export function roomHours(room: Pick<Room, 'disponivel_madrugada' | 'disponivel_fim_de_semana'>): string {
  const dias = room.disponivel_fim_de_semana ? 'Todos os dias' : 'Seg a sex'
  const horas = room.disponivel_madrugada ? '24 h' : 'a partir das 08:00'
  return `${dias}, ${horas}`
}
