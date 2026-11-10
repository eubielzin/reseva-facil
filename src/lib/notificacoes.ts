import type { Notificacao } from '@/types'

/** Tela que a notificação abre (mesmos links dos botões dos emails). */
export function linkDaNotificacao(n: Pick<Notificacao, 'tipo' | 'reserva_id'>): string {
  const destaque = n.reserva_id ? `destaque=${n.reserva_id}` : ''
  switch (n.tipo) {
    case 'pedido_novo':
      return `/pedidos${destaque ? `?${destaque}` : ''}`
    case 'cancelamento_solicitado':
      return `/pedidos?aba=cancelamentos${destaque ? `&${destaque}` : ''}`
    case 'email_falhou':
      return '/perfil/emails'
    case 'ingresso_emitido':
    case 'ingresso_cancelado':
    case 'evento_cancelado':
    case 'evento_alterado':
      return '/ingressos'
    default:
      return `/reservas${destaque ? `?${destaque}` : ''}`
  }
}
