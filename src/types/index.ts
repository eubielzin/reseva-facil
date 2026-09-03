export interface Room {
  id: string
  nome: string
  capacidade: number
  disponivel_madrugada: boolean
  disponivel_fim_de_semana: boolean
  created_at: string
  updated_at: string
}

export interface Reservation {
  id: string
  sala_id: string
  titulo: string
  participante_responsavel: string
  quantidade_participantes: number
  data: string // ISO date string YYYY-MM-DD
  horario_inicio: string // HH:MM
  horario_fim: string // HH:MM
  nome_empresa?: string | null
  nivel_evento?: 'baixa' | 'media' | 'alta' | null
  created_at: string
  updated_at: string
}

export interface ReservationWithRoom extends Reservation {
  sala: Room
}

export type ReservationStatus = 'em_andamento' | 'proxima' | 'encerrada'

export interface ReservationWithStatus extends ReservationWithRoom {
  status: ReservationStatus
}

export interface DashboardStats {
  total_salas: number
  total_reservas: number
  reservas_em_andamento: number
  proximas_reservas: ReservationWithRoom[]
}

export interface ApiError {
  error: string
  details?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
}
