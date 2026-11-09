import type { AcaoReserva, ApprovalStatus, ReservationWithRoom, DashboardStats, Ocupacao } from '@/types'
import type { ReservationFormValues } from '@/schemas/reservation'
import { apiFetch } from '@/lib/api-client'

// Admin recebe todas as reservas; os demais, só as que criaram (filtrado pela API)
export async function fetchReservations(salaId?: string, status?: ApprovalStatus): Promise<ReservationWithRoom[]> {
  const params = new URLSearchParams()
  if (salaId) params.set('sala_id', salaId)
  if (status) params.set('status', status)
  const query = params.toString()
  const res = await apiFetch(query ? `/reservas?${query}` : '/reservas')
  if (!res.ok) throw new Error('Erro ao buscar reservas.')
  return res.json()
}

// Horários ocupados do dia, de todos os usuários, sem título nem responsável
export async function fetchOcupacao(data: string, salaId?: string): Promise<Ocupacao[]> {
  const params = new URLSearchParams({ data })
  if (salaId) params.set('sala_id', salaId)
  const res = await apiFetch(`/reservas/ocupacao?${params}`)
  if (!res.ok) throw new Error('Erro ao buscar horários ocupados.')
  return res.json()
}

export async function fetchReservation(id: string): Promise<ReservationWithRoom> {
  const res = await apiFetch(`/reservas/${id}`)
  if (!res.ok) throw new Error('Reserva não encontrada.')
  return res.json()
}

export async function createReservation(values: ReservationFormValues): Promise<ReservationWithRoom> {
  const res = await apiFetch('/reservas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro ao criar reserva.')
  return data
}

export async function updateReservation(
  id: string,
  values: ReservationFormValues
): Promise<ReservationWithRoom> {
  const res = await apiFetch(`/reservas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erro ao atualizar reserva.')
  return data
}

export async function deleteReservation(id: string): Promise<void> {
  const res = await apiFetch(`/reservas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Erro ao excluir reserva.')
  }
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const res = await apiFetch('/dashboard')
  if (!res.ok) throw new Error('Erro ao buscar dados do dashboard.')
  return res.json()
}

const ACAO_PATH: Record<AcaoReserva, string> = {
  aprovar: 'aprovar',
  recusar: 'recusar',
  cancelar: 'cancelar',
  aprovar_cancelamento: 'cancelamento/aprovar',
  recusar_cancelamento: 'cancelamento/recusar',
}

// Aprovar, recusar (com motivo opcional), cancelar e decidir cancelamento
export async function mudarStatusReserva(
  id: string,
  acao: AcaoReserva,
  motivo?: string
): Promise<ReservationWithRoom> {
  const res = await apiFetch(`/reservas/${id}/${ACAO_PATH[acao]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: acao === 'recusar' ? JSON.stringify({ motivo: motivo?.trim() || null }) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Não foi possível atualizar a reserva.')
  return data
}
