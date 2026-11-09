import { cn } from '@/lib/utils'
import type { ApprovalStatus } from '@/types'

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  cancelamento_solicitado: 'Cancelamento solicitado',
  cancelada: 'Cancelada',
}

// Âmbar = aguardando decisão; vermelho = recusada; cancelada some para o cinza
const CLASS: Record<ApprovalStatus, string> = {
  pendente: 'bg-pill-warning text-warning',
  aprovada: 'bg-booked-soft text-booked',
  recusada: 'bg-pill-negative text-pill-negative-ink',
  cancelamento_solicitado: 'bg-pill-warning text-warning',
  cancelada: 'text-muted-foreground px-0 line-through',
}

export function ApprovalStatusBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium',
        CLASS[status],
        className
      )}
    >
      {(status === 'pendente' || status === 'cancelamento_solicitado') && (
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      )}
      {APPROVAL_LABEL[status]}
    </span>
  )
}

/** "1º pedido" / "2º de 3" para pedidos pendentes que disputam o mesmo horário. */
export function OrdemPedido({ ordem, concorrentes }: { ordem?: number; concorrentes?: number }) {
  if (!ordem || !concorrentes) return null
  return (
    <span className="text-xs text-muted-foreground whitespace-nowrap">
      {ordem}º de {concorrentes + 1} pedidos
    </span>
  )
}
