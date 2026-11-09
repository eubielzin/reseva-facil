import type { AcaoReserva, ApprovalStatus, Papel } from '@/types'

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

// ---------------------------------------------------------------------------
// Aprovação de reservas — espelho de BusinessRules.java (reseva-api).
// A API é quem decide; aqui é só para a UI mostrar as ações certas.
// ---------------------------------------------------------------------------

/** Só aprovada e cancelamento solicitado ocupam o horário. Pendente não bloqueia. */
export function bloqueiaHorario(status: ApprovalStatus): boolean {
  return status === 'aprovada' || status === 'cancelamento_solicitado'
}

export function podeCriarReserva(papel: Papel): boolean {
  return papel === 'organizador' || papel === 'admin'
}

/** Organizador edita só a própria reserva pendente; admin edita qualquer reserva ativa. */
export function podeEditarReserva(status: ApprovalStatus, papel: Papel, dono: boolean): boolean {
  if (papel === 'admin') return status === 'pendente' || bloqueiaHorario(status)
  if (papel === 'organizador') return dono && status === 'pendente'
  return false
}

/** Status depois da ação, ou null se a ação não é permitida. */
export function proximoStatus(
  atual: ApprovalStatus,
  acao: AcaoReserva,
  papel: Papel,
  dono: boolean
): ApprovalStatus | null {
  if (papel === 'admin') {
    switch (acao) {
      case 'aprovar':
        return atual === 'pendente' ? 'aprovada' : null
      case 'recusar':
        return atual === 'pendente' ? 'recusada' : null
      case 'cancelar':
        return atual === 'pendente' || bloqueiaHorario(atual) ? 'cancelada' : null
      case 'aprovar_cancelamento':
        return atual === 'cancelamento_solicitado' ? 'cancelada' : null
      case 'recusar_cancelamento':
        return atual === 'cancelamento_solicitado' ? 'aprovada' : null
    }
  }
  if (papel === 'organizador' && dono && acao === 'cancelar') {
    if (atual === 'pendente') return 'cancelada'
    if (atual === 'aprovada') return 'cancelamento_solicitado'
  }
  return null
}

export interface PedidoDisputa extends TimeInterval {
  id: string
  sala_id: string
  data: string
  created_at: string
}

function disputam(a: PedidoDisputa, b: PedidoDisputa): boolean {
  return a.sala_id === b.sala_id && a.data === b.data && intervalsConflict(a, b)
}

/**
 * Agrupa pedidos pendentes que disputam o mesmo horário (mesma sala e data, com
 * sobreposição direta ou encadeada). Cada grupo vem em ordem de chegada; grupos
 * de um pedido só são pedidos sem disputa. Grupos ordenados por data e horário.
 */
export function agruparDisputas<T extends PedidoDisputa>(pedidos: T[]): T[][] {
  const grupos: T[][] = []
  const visitado = new Set<string>()

  for (const inicial of pedidos) {
    if (visitado.has(inicial.id)) continue
    const grupo: T[] = []
    const fila = [inicial]
    visitado.add(inicial.id)
    while (fila.length > 0) {
      const atual = fila.shift() as T
      grupo.push(atual)
      for (const outro of pedidos) {
        if (!visitado.has(outro.id) && disputam(atual, outro)) {
          visitado.add(outro.id)
          fila.push(outro)
        }
      }
    }
    grupo.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    grupos.push(grupo)
  }

  const inicioGrupo = (g: T[]) =>
    g.reduce((min, p) => {
      const chave = `${p.data} ${p.horario_inicio}`
      return chave < min ? chave : min
    }, `${g[0].data} ${g[0].horario_inicio}`)
  return grupos.sort((a, b) => inicioGrupo(a).localeCompare(inicioGrupo(b)))
}
