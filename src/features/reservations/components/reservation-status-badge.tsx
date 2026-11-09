import { cn, getReservationStatus, statusLabel } from '@/lib/utils'
import type { ReservationStatus, ReservationWithRoom } from '@/types'

// Só o que acontece agora leva o matiz das reservas; encerrada é texto cinza, sem pill
const STATUS_CLASS: Record<ReservationStatus, string> = {
  em_andamento: 'bg-booked-soft text-booked',
  proxima: 'bg-muted text-[#3d3d3d] dark:text-foreground',
  encerrada: 'text-muted-foreground px-0',
}

export function ReservationStatusBadge({ reservation }: { reservation: ReservationWithRoom }) {
  const status = getReservationStatus(reservation)
  return (
    <span
      className={cn(
        'inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium',
        STATUS_CLASS[status]
      )}
    >
      {status === 'em_andamento' && <span className="h-1.5 w-1.5 rounded-full bg-booked" />}
      {statusLabel(status)}
    </span>
  )
}
