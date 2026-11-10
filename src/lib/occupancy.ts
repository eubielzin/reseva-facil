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

function minutos(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

/** Janela da linha do tempo do card: 08h–22h, ou o dia todo se a sala aceita madrugada. */
export function dayWindow(room: Pick<Room, 'disponivel_madrugada'>): { de: string; ate: string } {
  return room.disponivel_madrugada ? { de: '00:00', ate: '24:00' } : { de: '08:00', ate: '22:00' }
}

export interface DayBlock {
  inicio: string
  fim: string
  left: number // % a partir do início da janela
  width: number // % da janela
}

/** Reservas de uma sala recortadas na janela do dia, em porcentagem, para desenhar a faixa. */
export function dayBlocks(roomId: string, todays: Interval[], janela: { de: string; ate: string }): DayBlock[] {
  const de = minutos(janela.de)
  const total = minutos(janela.ate) - de
  return todays
    .filter((r) => r.sala_id === roomId)
    .map((r) => {
      const ini = Math.max(minutos(r.horario_inicio), de)
      const fim = Math.min(minutos(r.horario_fim), de + total)
      return { r, ini, fim }
    })
    .filter(({ ini, fim }) => fim > ini)
    .map(({ r, ini, fim }) => ({
      inicio: r.horario_inicio.slice(0, 5),
      fim: r.horario_fim.slice(0, 5),
      left: ((ini - de) / total) * 100,
      width: ((fim - ini) / total) * 100,
    }))
}

/** Posição do "agora" na janela, em %; null fora dela. */
export function nowPosition(now: string, janela: { de: string; ate: string }): number | null {
  const de = minutos(janela.de)
  const total = minutos(janela.ate) - de
  const p = ((minutos(now) - de) / total) * 100
  return p < 0 || p > 100 ? null : p
}

const FOTOS_MOCK = 6

/**
 * Foto da sala; enquanto o upload (MinIO) não existe, usa uma das fotos de exemplo.
 * Com a posição na lista, as primeiras salas não repetem foto; sem ela, sorteia pelo id (sempre a mesma).
 */
export function roomPhoto(room: Pick<Room, 'id' | 'foto_url'>, posicao?: number): string {
  if (room.foto_url) return room.foto_url
  let n = posicao ?? 0
  if (posicao === undefined) for (const c of room.id) n = (n * 31 + c.charCodeAt(0)) >>> 0
  return `/mock/salas/sala-${(n % FOTOS_MOCK) + 1}.jpg`
}
