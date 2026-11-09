import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { EventoPublico } from '@/types'
import { DataBloco } from './data-bloco'
import { VagasBadge } from './vagas-badge'

export function EventoCard({ evento }: { evento: EventoPublico }) {
  return (
    <Link
      href={`/eventos/${evento.id}`}
      className="group flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <DataBloco data={evento.data} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-medium leading-snug group-hover:underline underline-offset-2">{evento.titulo}</h2>
          <VagasBadge evento={evento} />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(evento.horario_inicio)}–{formatTime(evento.horario_fim)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {evento.sala_nome}
          </span>
        </p>
        {evento.descricao && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{evento.descricao}</p>
        )}
      </div>
    </Link>
  )
}
