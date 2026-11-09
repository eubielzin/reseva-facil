import { Lock, Ticket } from 'lucide-react'
import type { EventoResumo } from '@/types'

/** "Evento · 34/80 ingressos" (com cadeado se privado), na lista de reservas e nos pedidos. */
export function EventoSelo({ evento }: { evento: EventoResumo }) {
  return (
    <span className="inline-flex h-5 flex-none items-center gap-1 whitespace-nowrap rounded-full bg-muted px-2 text-xs font-medium">
      {evento.visibilidade === 'privado' ? <Lock className="h-3 w-3" /> : <Ticket className="h-3 w-3" />}
      Evento · {evento.ingressos_emitidos}/{evento.limite_ingressos} ingressos
    </span>
  )
}
