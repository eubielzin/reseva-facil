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
    all: (salaId?: string) => ['reservations', { salaId }] as const,
    detail: (id: string) => ['reservations', id] as const,
    // Sob o prefixo 'reservations': criar/editar/excluir reserva já invalida a ocupação
    ocupacao: (data?: string, salaId?: string) => ['reservations', 'ocupacao', { data, salaId }] as const,
  },
  dashboard: ['dashboard'] as const,
}
