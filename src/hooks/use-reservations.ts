import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import {
  fetchReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  fetchDashboard,
  fetchOcupacao,
} from '@/services/reservations'
import type { ReservationFormValues } from '@/schemas/reservation'

export function useReservations(salaId?: string) {
  return useQuery({
    queryKey: queryKeys.reservations.all(salaId),
    queryFn: () => fetchReservations(salaId),
  })
}

/** Horários ocupados de um dia (de todos os usuários), opcionalmente de uma sala só. */
export function useOcupacao(data?: string, salaId?: string, options?: { requireSala?: boolean }) {
  return useQuery({
    queryKey: queryKeys.reservations.ocupacao(data, salaId),
    queryFn: () => fetchOcupacao(data as string, salaId),
    enabled: !!data && (!options?.requireSala || !!salaId),
  })
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    refetchInterval: 1000 * 60, // Atualiza a cada 1 minuto para refletir status em tempo real
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (values: ReservationFormValues) => createReservation(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      toast.success('Reserva criada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ReservationFormValues }) =>
      updateReservation(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      toast.success('Reserva atualizada com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteReservation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      toast.success('Reserva excluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
