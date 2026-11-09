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
  /** Fluxo de aprovação (diferente de ReservationStatus, que é sobre o horário) */
  status: ApprovalStatus
  motivo_recusa?: string
  decidido_em?: string
  cancelamento_solicitado_em?: string
  /** Só em pedidos pendentes: posição na fila de quem disputa o mesmo horário (1 = primeiro) */
  ordem_pedido?: number
  concorrentes?: number
  created_at: string
  updated_at: string
}

export type Papel = 'usuario' | 'organizador' | 'admin'

export type ApprovalStatus =
  | 'pendente'
  | 'aprovada'
  | 'recusada'
  | 'cancelamento_solicitado'
  | 'cancelada'

export type AcaoReserva =
  | 'aprovar'
  | 'recusar'
  | 'cancelar'
  | 'aprovar_cancelamento'
  | 'recusar_cancelamento'

/** GET/POST /me */
export interface Perfil {
  id: string
  nome?: string
  email?: string
  papel: Papel
  created_at?: string
}

export type TipoNotificacao =
  | 'pedido_novo'
  | 'pedido_aprovado'
  | 'pedido_recusado'
  | 'cancelamento_solicitado'
  | 'cancelamento_aprovado'
  | 'cancelamento_recusado'
  | 'reserva_cancelada'
  | 'email_falhou'

export interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem?: string
  reserva_id?: string
  email_id?: string
  lida_em?: string
  created_at: string
}

/** Email enviado pelo oxymail (lista de falhas do admin) */
export interface EmailRegistro {
  id: string
  destinatario: string
  assunto: string
  status: 'pendente' | 'enviado' | 'falhou'
  tentativas: number
  ultimo_erro?: string
  created_at: string
  enviado_em?: string
}

/** Horário ocupado de uma sala, sem detalhes da reserva (GET /reservas/ocupacao). */
export interface Ocupacao {
  id: string
  sala_id: string
  data: string // YYYY-MM-DD
  horario_inicio: string // HH:MM
  horario_fim: string // HH:MM
}

export interface ReservationWithRoom extends Reservation {
  sala: Room
}

export type ReservationStatus = 'em_andamento' | 'proxima' | 'encerrada'


export interface DashboardStats {
  total_salas: number
  total_reservas: number
  reservas_em_andamento: number
  pedidos_pendentes: number
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
