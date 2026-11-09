import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import {
  cancelarIngresso,
  editarEvento,
  fetchEvento,
  fetchEventoPorConvite,
  fetchMeusIngressos,
  fetchVitrine,
  novoConvite,
  pegarIngresso,
} from '@/services/eventos'
import type { EventoFormValues } from '@/schemas/evento'

export function useVitrine() {
  return useQuery({ queryKey: queryKeys.eventos.vitrine, queryFn: fetchVitrine })
}

/** Evento público por id, ou privado pelo código do convite. */
export function useEvento(params: { id?: string; convite?: string }) {
  const { id, convite } = params
  return useQuery({
    queryKey: convite ? queryKeys.eventos.convite(convite) : queryKeys.eventos.detalhe(id ?? ''),
    queryFn: () => (convite ? fetchEventoPorConvite(convite) : fetchEvento(id as string)),
    enabled: !!(id || convite),
    retry: false,
  })
}

export function useMeusIngressos() {
  return useQuery({ queryKey: queryKeys.ingressos.meus, queryFn: fetchMeusIngressos })
}

export function usePegarIngresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventoId, tag, convite }: { eventoId: string; tag: string; convite?: string }) =>
      pegarIngresso(eventoId, tag, convite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: queryKeys.ingressos.meus })
      qc.invalidateQueries({ queryKey: queryKeys.notificacoes.root })
      toast.success('Ingresso garantido! Enviamos o QR code para o seu email.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useCancelarIngresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelarIngresso(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventos'] })
      qc.invalidateQueries({ queryKey: queryKeys.ingressos.meus })
      toast.success('Ingresso cancelado. A vaga foi liberada.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useEditarEvento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reservaId, values }: { reservaId: string; values: EventoFormValues }) =>
      editarEvento(reservaId, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['eventos'] })
      toast.success('Evento atualizado.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useNovoConvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reservaId: string) => novoConvite(reservaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Novo link gerado. O link antigo não funciona mais.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
