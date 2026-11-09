import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-client'
import {
  fetchContagemNaoLidas,
  fetchEmailsFalhos,
  fetchNotificacoes,
  fetchPerfil,
  marcarNotificacaoLida,
  marcarTodasLidas,
  reenviarEmail,
} from '@/services/perfil'

export function usePerfil() {
  return useQuery({ queryKey: queryKeys.perfil, queryFn: fetchPerfil })
}

export function useNotificacoes(naoLidas = false, limite = 50) {
  return useQuery({
    queryKey: queryKeys.notificacoes.lista(naoLidas, limite),
    queryFn: () => fetchNotificacoes(naoLidas, limite),
  })
}

/** Número do sininho: atualiza a cada 30 s e quando a janela volta ao foco. */
export function useContagemNaoLidas(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificacoes.contagem,
    queryFn: fetchContagemNaoLidas,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    enabled,
  })
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => marcarNotificacaoLida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificacoes.root }),
  })
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: marcarTodasLidas,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificacoes.root }),
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useEmailsFalhos(enabled: boolean) {
  return useQuery({ queryKey: queryKeys.emails.falhos, queryFn: fetchEmailsFalhos, enabled })
}

export function useReenviarEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reenviarEmail(id),
    onSuccess: (email) => {
      qc.invalidateQueries({ queryKey: queryKeys.emails.falhos })
      if (email.status === 'enviado') toast.success(`Email reenviado para ${email.destinatario}.`)
      else toast.error(`Falhou de novo: ${email.ultimo_erro ?? 'erro desconhecido'}`)
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
