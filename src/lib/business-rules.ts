import type { AcaoReserva, ApprovalStatus, Papel, ResultadoCheckin } from '@/types'

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

// ---------------------------------------------------------------------------
// Eventos e ingressos — espelho de BusinessRules.java (reseva-api)
// ---------------------------------------------------------------------------

export const TAGS_SUGERIDAS = ['Organização', 'Staff', 'Aluno']
export const MAX_TAGS = 10
export const MAX_TAMANHO_TAG = 40

export function vagasRestantes(limite: number, ativos: number): number {
  return Math.max(0, limite - ativos)
}

/** "ultimas" quando sobram menos de 10% das vagas (ou só 1). */
export function situacaoVagas(vagas: number, limite: number): 'esgotado' | 'ultimas' | 'disponivel' {
  if (vagas <= 0) return 'esgotado'
  if (vagas === 1 || vagas < limite * 0.1) return 'ultimas'
  return 'disponivel'
}

const chaveTag = (tag: string) => tag.trim().replace(/\s+/g, ' ').toLowerCase()

/** Remove espaços nas pontas, vazias e repetidas (ignorando maiúsculas), mantendo a ordem. */
export function normalizarTags(tags: string[]): string[] {
  const vistas = new Set<string>()
  const resultado: string[] = []
  for (const tag of tags) {
    const limpa = tag.trim().replace(/\s+/g, ' ')
    if (!limpa || vistas.has(chaveTag(limpa))) continue
    vistas.add(chaveTag(limpa))
    resultado.push(limpa)
  }
  return resultado
}

export function erroTags(tags: string[]): string | null {
  if (tags.length === 0) return 'Escolha pelo menos uma tag para o evento.'
  if (tags.length > MAX_TAGS) return `Use no máximo ${MAX_TAGS} tags.`
  if (tags.some((t) => t.length > MAX_TAMANHO_TAG)) {
    return `Cada tag deve ter no máximo ${MAX_TAMANHO_TAG} caracteres.`
  }
  return null
}

/** Marca a tag se não estiver na lista; desmarca se estiver (comparando sem maiúsculas). */
export function alternarTag(tags: string[], tag: string): string[] {
  const chave = chaveTag(tag)
  return tags.some((t) => chaveTag(t) === chave)
    ? tags.filter((t) => chaveTag(t) !== chave)
    : normalizarTags([...tags, tag])
}

// ---------------------------------------------------------------------------
// Check-in — espelho de BusinessRules.java (reseva-api)
// ---------------------------------------------------------------------------

export const CHECKIN_MINUTOS_PADRAO = 60
export const CHECKIN_MINUTOS_MAX = 1440

const ALFABETO = '[2-9A-HJ-NP-Z]'
const COM_PREFIXO = new RegExp(`RF[\\s-]*(${ALFABETO}{4})[\\s-]*(${ALFABETO}{4})`)
const SEM_PREFIXO = new RegExp(`^(${ALFABETO}{4})-?(${ALFABETO}{4})$`)

/** RF-XXXX-XXXX a partir do texto do QR ou do que foi digitado; null se não for código. */
export function extrairCodigoIngresso(lido: string): string | null {
  const texto = lido.toUpperCase().trim()
  if (!texto) return null
  const m = COM_PREFIXO.exec(texto)
  if (m) return `RF-${m[1]}-${m[2]}`
  const s = SEM_PREFIXO.exec(texto.replace(/\s+/g, ''))
  return s ? `RF-${s[1]}-${s[2]}` : null
}

/** "yyyy-MM-ddTHH:mm" da abertura do check-in (pode cair no dia anterior). */
export function aberturaCheckin(data: string, horarioInicio: string, minutosAntes: number): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  const [hora, minuto] = horarioInicio.split(':').map(Number)
  const d = new Date(Date.UTC(ano, mes - 1, dia, hora, minuto) - minutosAntes * 60_000)
  return d.toISOString().slice(0, 16)
}

export function corDoResultado(resultado: ResultadoCheckin): 'verde' | 'amarelo' | 'vermelho' {
  if (resultado === 'ok') return 'verde'
  if (resultado === 'ja_entrou' || resultado === 'antes_da_abertura') return 'amarelo'
  return 'vermelho'
}
