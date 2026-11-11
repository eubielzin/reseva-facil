import Link from 'next/link'
import { Clock, MapPin } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import type { EventoPublico } from '@/types'
import { DataBloco } from './data-bloco'
import { EventoCapa } from './evento-capa'
import { VagasBadge } from './vagas-badge'

export function EventoCard({ evento }: { evento: EventoPublico }) {
  return (
    <Link
      href={`/eventos/${evento.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <EventoCapa id={evento.id} titulo={evento.titulo} data={evento.data} imagemUrl={evento.imagem_url}>
        <VagasBadge evento={evento} className="absolute left-3 top-3 h-6 bg-card/90 px-2.5 shadow-sm backdrop-blur" />
      </EventoCapa>
      <div className="flex flex-1 gap-3 p-4">
        <DataBloco data={evento.data} />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 font-medium leading-snug group-hover:underline underline-offset-2">{evento.titulo}</h2>
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
      </div>
    </Link>
  )
}

export function EventoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
      <div className="flex gap-3 p-4">
        <div className="h-14 w-14 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
