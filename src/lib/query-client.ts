import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
})

export const queryKeys = {
  rooms: {
    all: ['rooms'] as const,
    detail: (id: string) => ['rooms', id] as const,
  },
  reservations: {
    all: (salaId?: string, status?: string) => ['reservations', { salaId, status }] as const,
    detail: (id: string) => ['reservations', id] as const,
    // Sob o prefixo 'reservations': criar/editar/excluir reserva já invalida a ocupação
    ocupacao: (data?: string, salaId?: string) => ['reservations', 'ocupacao', { data, salaId }] as const,
  },
  dashboard: ['dashboard'] as const,
  perfil: ['perfil'] as const,
  notificacoes: {
    // Prefixo comum: marcar como lida invalida lista e contagem juntas
    root: ['notificacoes'] as const,
    lista: (naoLidas: boolean, limite: number) => ['notificacoes', 'lista', { naoLidas, limite }] as const,
    contagem: ['notificacoes', 'contagem'] as const,
  },
  emails: {
    falhos: ['emails', 'falhou'] as const,
  },
  eventos: {
    vitrine: ['eventos', 'vitrine'] as const,
    detalhe: (id: string) => ['eventos', 'detalhe', id] as const,
    convite: (codigo: string) => ['eventos', 'convite', codigo] as const,
  },
  ingressos: {
    meus: ['ingressos', 'meus'] as const,
  },
}
