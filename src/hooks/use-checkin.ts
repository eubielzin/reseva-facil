import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import { desfazerCheckin, fetchCheckinInfo, fetchPainel, lerIngresso, novoLinkCheckin } from '@/services/checkin'

export function useCheckinInfo(codigoCheckin: string) {
  return useQuery({
    queryKey: queryKeys.checkin.link(codigoCheckin),
    queryFn: () => fetchCheckinInfo(codigoCheckin),
    retry: false,
  })
}

/** Leitura no leitor. Erros de rede viram toast; resultados (ja_entrou etc.) vêm no sucesso. */
export function useLerIngresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventoId, codigo, codigoCheckin }: { eventoId: string; codigo: string; codigoCheckin?: string }) =>
      lerIngresso(eventoId, codigo, codigoCheckin),
    onSuccess: (leitura) => {
      if (leitura.resultado === 'ok') qc.invalidateQueries({ queryKey: ['checkin', 'painel'] })
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

/** Painel: atualiza a cada 10 s enquanto o check-in está aberto. */
export function usePainelEvento(reservaId: string) {
  return useQuery({
    queryKey: queryKeys.checkin.painel(reservaId),
    queryFn: () => fetchPainel(reservaId),
    refetchInterval: (query) => (query.state.data?.evento.janela_aberta ? 10_000 : false),
  })
}

export function useDesfazerCheckin(reservaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ingressoId: string) => desfazerCheckin(ingressoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.checkin.painel(reservaId) })
      toast.success('Check-in desfeito.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useNovoLinkCheckin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reservaId: string) => novoLinkCheckin(reservaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      toast.success('Novo link de check-in gerado. O antigo não funciona mais.')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
