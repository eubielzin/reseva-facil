import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatTime } from '@/lib/utils'
import { NivelDot } from '@/features/reservations/components/nivel-evento'
import type { ReservationWithRoom } from '@/types'

function dayLabel(data: string): string {
  const d = parseISO(data)
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  return format(d, 'EEE, dd/MM', { locale: ptBR })
}

// Próximas reservas: duas linhas por item, data e horário alinhados à direita
export function UpcomingReservations({ reservations }: { reservations: ReservationWithRoom[] }) {
  if (reservations.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground">
        Nenhuma reunião marcada daqui para a frente.
      </p>
    )
  }

  return (
    <ul>
      {reservations.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-4 border-t border-rule py-2.5 first:border-t-0 first:pt-0">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              {r.nivel_evento && <NivelDot nivel={r.nivel_evento} />}
              <span className="truncate">{r.titulo}</span>
            </p>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {r.sala.nome} · {r.participante_responsavel}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm">{dayLabel(r.data)}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {formatTime(r.horario_inicio)}–{formatTime(r.horario_fim)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
