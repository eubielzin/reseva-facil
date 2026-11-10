'use client'

import Image from 'next/image'
import { CalendarClock, CalendarPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RoomActions } from './room-actions'
import { cn } from '@/lib/utils'
import { dayBlocks, dayWindow, nowPosition, roomHours, roomPhoto, type RoomNow } from '@/lib/occupancy'
import type { Ocupacao, Room } from '@/types'

interface RoomCardProps {
  room: Room
  posicao?: number
  state?: RoomNow
  todays?: Ocupacao[]
  now: string
  isAdmin: boolean
  onReservar?: () => void
}

function StatusPill({ state }: { state?: RoomNow }) {
  if (!state) return null
  const emUso = state.kind === 'em_uso'
  return (
    <span className="absolute left-3 top-3 inline-flex h-6 items-center gap-1.5 rounded-full bg-card/90 px-2.5 text-xs shadow-sm backdrop-blur">
      <span className={cn('h-1.5 w-1.5 rounded-full', emUso ? 'bg-booked' : 'bg-positive')} />
      <span className="font-medium">{emUso ? 'Em uso' : 'Livre'}</span>
      <span className="text-muted-foreground">
        {state.ate ? `até ${state.ate}` : 'o resto do dia'}
      </span>
    </span>
  )
}

// Faixa do dia: blocos azuis são reservas aprovadas; a linha é o agora
function DayTimeline({ room, todays, now }: { room: Room; todays?: Ocupacao[]; now: string }) {
  const janela = dayWindow(room)
  const blocos = todays ? dayBlocks(room.id, todays, janela) : []
  const agora = nowPosition(now, janela)
  const meio = room.disponivel_madrugada ? '12:00' : '15:00'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Hoje</span>
        <span className="text-muted-foreground">
          {!todays
            ? ''
            : blocos.length === 0
              ? 'Sem reservas'
              : `${blocos.length} ${blocos.length === 1 ? 'reserva' : 'reservas'}`}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted" role="img" aria-label={
        blocos.length === 0
          ? 'Sem reservas hoje'
          : `Reservada hoje: ${blocos.map((b) => `${b.inicio} às ${b.fim}`).join(', ')}`
      }>
        {blocos.map((b) => (
          <span
            key={`${b.inicio}-${b.fim}`}
            title={`${b.inicio} – ${b.fim}`}
            className="absolute inset-y-0 rounded-full bg-booked"
            style={{ left: `${b.left}%`, width: `max(${b.width}%, 4px)` }}
          />
        ))}
        {agora !== null && (
          <span
            aria-hidden
            className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
            style={{ left: `${agora}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] tabular-nums text-muted-foreground">
        <span>{janela.de}</span>
        <span>{meio}</span>
        <span>{janela.ate}</span>
      </div>
    </div>
  )
}

export function RoomCard({ room, posicao, state, todays, now, isAdmin, onReservar }: RoomCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {/* unoptimized: as fotos virão do MinIO, sem precisar cadastrar o domínio no next.config */}
        <Image
          src={roomPhoto(room, posicao)}
          alt={`Foto da sala ${room.nome}`}
          fill
          unoptimized
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <StatusPill state={state} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{room.nome}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={1.75} />
                {room.capacidade} {room.capacidade === 1 ? 'lugar' : 'lugares'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                {roomHours(room)}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="-mr-2 -mt-1 shrink-0">
              <RoomActions room={room} />
            </div>
          )}
        </div>

        <DayTimeline room={room} todays={todays} now={now} />

        {onReservar && (
          <Button variant="outline" className="mt-auto w-full" onClick={onReservar}>
            <CalendarPlus className="h-4 w-4" />
            {isAdmin ? 'Reservar' : 'Pedir reserva'}
          </Button>
        )}
      </div>
    </article>
  )
}

export function RoomCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}
