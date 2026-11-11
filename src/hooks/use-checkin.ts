import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import { definirColaborador, desfazerCheckin, fetchCheckinInfo, fetchPainel, lerIngresso } from '@/services/checkin'

export function useCheckinInfo(eventoId: string) {
  return useQuery({
    queryKey: queryKeys.checkin.leitor(eventoId),
    queryFn: () => fetchCheckinInfo(eventoId),
    retry: false,
  })
}

/** Leitura no leitor. Erros de rede viram toast; resultados (ja_entrou etc.) vêm no sucesso. */
export function useLerIngresso() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventoId, codigo }: { eventoId: string; codigo: string }) => lerIngresso(eventoId, codigo),
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

export function useDefinirColaborador(reservaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ingressoId, colaborador }: { ingressoId: string; colaborador: boolean }) =>
      definirColaborador(ingressoId, colaborador),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: queryKeys.checkin.painel(reservaId) })
      toast.success(
        p.colaborador
          ? `${p.nome ?? p.codigo} agora pode abrir o leitor de QR.`
          : `${p.nome ?? p.codigo} não é mais colaborador.`
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
