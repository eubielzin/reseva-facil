import { createServerClient } from '@/lib/supabase'
import type { Reservation, ReservationWithRoom } from '@/types'
import type { ReservationFormValues } from '@/schemas/reservation'

export async function getAllReservations(salaId?: string): Promise<ReservationWithRoom[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('reservas')
    .select('*, sala:salas(*)')
    .order('data', { ascending: true })
    .order('horario_inicio', { ascending: true })

  if (salaId) {
    query = query.eq('sala_id', salaId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as ReservationWithRoom[]
}

export async function getReservationById(id: string): Promise<ReservationWithRoom | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reservas')
    .select('*, sala:salas(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }
  return data as ReservationWithRoom
}

function buildPayload(values: ReservationFormValues): Record<string, unknown> {
  const { nome_empresa, nivel_evento, ...base } = values
  const payload: Record<string, unknown> = { ...base }
  if (nome_empresa != null) payload.nome_empresa = nome_empresa
  if (nivel_evento != null) payload.nivel_evento = nivel_evento
  return payload
}

export async function createReservation(values: ReservationFormValues): Promise<Reservation> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reservas')
    .insert(buildPayload(values))
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Reservation
}

export async function updateReservation(
  id: string,
  values: ReservationFormValues
): Promise<Reservation> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('reservas')
    .update(buildPayload(values))
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Reservation
}

export async function deleteReservation(id: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('reservas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getReservationsCount(): Promise<number> {
  const supabase = createServerClient()
  const { count, error } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(error.message)
  return count ?? 0
}

// Returns reservations that overlap with the given time slot, optionally excluding one (for edit)
export async function findConflicts(
  salaId: string,
  data: string,
  horarioInicio: string,
  horarioFim: string,
  excludeId?: string
): Promise<Reservation[]> {
  const supabase = createServerClient()

  // Two intervals overlap when: A.start <= B.end AND A.end >= B.start
  // Non-strict inequality so that back-to-back bookings (e.g. 14–15 and 15–16) ARE a conflict:
  // someone might still be in the room when the next reservation starts.
  let query = supabase
    .from('reservas')
    .select('*')
    .eq('sala_id', salaId)
    .eq('data', data)
    .lte('horario_inicio', horarioFim)
    .gte('horario_fim', horarioInicio)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: conflicts, error } = await query
  if (error) throw new Error(error.message)
  return conflicts as Reservation[]
}

export async function getActiveReservationsCount(): Promise<number> {
  const supabase = createServerClient()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentTime = now.toTimeString().slice(0, 5)

  const { count, error } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('data', today)
    .lte('horario_inicio', currentTime)
    .gt('horario_fim', currentTime)

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getUpcomingReservations(): Promise<ReservationWithRoom[]> {
  const supabase = createServerClient()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const currentTime = now.toTimeString().slice(0, 5)

  const { data, error } = await supabase
    .from('reservas')
    .select('*, sala:salas(*)')
    .or(
      `data.gt.${today},and(data.eq.${today},horario_inicio.gt.${currentTime})`
    )
    .order('data', { ascending: true })
    .order('horario_inicio', { ascending: true })
    .limit(5)

  if (error) throw new Error(error.message)
  return data as ReservationWithRoom[]
}
