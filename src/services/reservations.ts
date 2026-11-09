import type { ReservationWithRoom, DashboardStats, Ocupacao } from '@/types'
import type { ReservationFormValues } from '@/schemas/reservation'
import { apiFetch } from '@/lib/api-client'

// Admin recebe todas as reservas; usuário comum, só as que criou (filtrado pela API)
export async function fetchReservations(salaId?: string): Promise<ReservationWithRoom[]> {
  const url = salaId ? `/reservas?sala_id=${salaId}` : '/reservas'
  const res = await apiFetch(url)
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
