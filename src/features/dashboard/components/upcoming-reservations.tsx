import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays } from 'lucide-react'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { ReservationWithRoom } from '@/types'

const NIVEL_DOT_CLASS: Record<string, string> = {
  baixa: 'bg-emerald-500',
  media: 'bg-amber-500',
  alta: 'bg-red-500',
  nenhum: 'bg-muted-foreground/40',
}

interface UpcomingReservationsProps {
  reservations: ReservationWithRoom[]
}

export function UpcomingReservations({ reservations }: UpcomingReservationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Próximas reservas</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma reserva futura encontrada.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reservations.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-2">
                    <span className={cn('inline-block h-2.5 w-2.5 rounded-full shrink-0', NIVEL_DOT_CLASS[r.nivel_evento ?? 'nenhum'])} />
                    {r.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.sala.nome} · {r.participante_responsavel}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {formatDate(r.data)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(r.horario_inicio)} – {formatTime(r.horario_fim)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
