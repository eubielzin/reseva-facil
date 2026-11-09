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
  mudarStatusReserva,
  fetchReservation,
} from '@/services/reservations'
import type { ReservationFormValues } from '@/schemas/reservation'
import type { AcaoReserva, ApprovalStatus } from '@/types'

export function useReservations(salaId?: string, status?: ApprovalStatus) {
  return useQuery({
    queryKey: queryKeys.reservations.all(salaId, status),
    queryFn: () => fetchReservations(salaId, status),
  })
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: queryKeys.reservations.detail(id),
    queryFn: () => fetchReservation(id),
    enabled: !!id,
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
    onSuccess: (reserva) => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      toast.success(
        reserva.status === 'pendente'
          ? 'Pedido enviado para aprovação. Você será avisado por email.'
          : 'Reserva criada com sucesso!'
      )
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

const MENSAGEM_SUCESSO: Record<AcaoReserva, string> = {
  aprovar: 'Pedido aprovado.',
  recusar: 'Pedido recusado.',
  cancelar: 'Reserva cancelada.',
  aprovar_cancelamento: 'Cancelamento aprovado. O horário foi liberado.',
  recusar_cancelamento: 'Cancelamento recusado. A reserva continua valendo.',
}

/** Aprovar, recusar, cancelar e decidir cancelamento. */
export function useMudarStatusReserva() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, acao, motivo }: { id: string; acao: AcaoReserva; motivo?: string }) =>
      mudarStatusReserva(id, acao, motivo),
    onSuccess: (reserva, { acao }) => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: queryKeys.dashboard })
      qc.invalidateQueries({ queryKey: queryKeys.notificacoes.root })
      toast.success(
        acao === 'cancelar' && reserva.status === 'cancelamento_solicitado'
          ? 'Pedido de cancelamento enviado ao administrador.'
          : MENSAGEM_SUCESSO[acao]
      )
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
