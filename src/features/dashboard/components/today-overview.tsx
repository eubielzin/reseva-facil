'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { addDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton, TableSkeleton } from '@/components/loading-state'
import { TodayFigures } from './today-figures'
import { TodayStrip, TodayStripLegend } from './today-strip'
import { UpcomingReservations } from './upcoming-reservations'
import { FreeRooms } from './free-rooms'
import { nowString, reservationsOn, roomNow, todayString } from '@/lib/occupancy'
import type { ReservationWithRoom, Room } from '@/types'

const LIST_CAP = 5

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card px-5 pt-4 pb-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-medium">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface TodayOverviewProps {
  rooms?: Room[]
  reservations?: ReservationWithRoom[]
  now: Date
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onReserve: (salaId?: string) => void
}

// Pergunta da tela: quais salas estão ocupadas agora e o que vem a seguir hoje?
export function TodayOverview({ rooms, reservations, now, isLoading, isError, onRetry, onReserve }: TodayOverviewProps) {
  const view = useMemo(() => {
    if (!rooms || !reservations) return null
    const today = todayString(now)
    const hhmm = nowString(now)
    const weekEnd = format(addDays(now, 7), 'yyyy-MM-dd')
    const todays = reservationsOn(today, reservations)
    const states = rooms.map((room) => ({ room, state: roomNow(room.id, todays, hhmm) }))

    const emUso = states.filter((s) => s.state.kind === 'em_uso').length
    const aComecar = todays.filter((r) => r.horario_inicio.slice(0, 5) > hhmm)
    const pessoasHoje = todays.reduce((sum, r) => sum + r.quantidade_participantes, 0)
    const proximos7 = reservations.filter((r) => r.data > today && r.data <= weekEnd).length

    const upcoming = [...reservations]
      .filter((r) => r.data > today || (r.data === today && r.horario_inicio.slice(0, 5) > hhmm))
      .sort((a, b) => a.data.localeCompare(b.data) || a.horario_inicio.localeCompare(b.horario_inicio))

    // Livres o resto do dia primeiro; depois quem fica livre por mais tempo
    const free = states
      .flatMap((s) => (s.state.kind === 'livre' ? [{ room: s.room, state: s.state }] : []))
      .sort((a, b) => (b.state.ate ?? '99:99').localeCompare(a.state.ate ?? '99:99'))

    return { today, hhmm, todays, emUso, aComecar, pessoasHoje, proximos7, upcoming, free }
  }, [rooms, reservations, now])

  const dateLine = capitalize(format(now, "EEEE, d 'de' MMMM", { locale: ptBR }))
  const next = view?.aComecar[0]
  const finding = view
    ? next
      ? `${dateLine} · próxima reunião às ${next.horario_inicio.slice(0, 5)}, ${next.sala.nome}`
      : `${dateLine} · nenhuma outra reunião hoje`
    : dateLine

  return (
    <div>
      <PageHeader
        title="Hoje"
        description={finding}
        action={
          <Button size="lg" onClick={() => onReserve()}>
            <Plus className="h-4 w-4" />
            Nova reserva
          </Button>
        }
      />

      {isError && (
        <ErrorState
          message="Não foi possível carregar as salas e reservas de hoje."
          onRetry={onRetry}
        />
      )}

      {!isError && isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 rounded-lg border bg-card">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} className="px-5 py-4 space-y-3" />
            ))}
          </div>
          <TableSkeleton rows={5} cols={1} />
        </div>
      )}

      {!isError && view && rooms && (
        /* Grade: uma coluna de blocos com gap de 12px; a última linha divide em 2 × ((largura − 12) / 2) */
        <div className="space-y-3">
          <TodayFigures
            figures={[
              { label: 'Em uso agora', value: view.emUso, unit: `de ${rooms.length} ${rooms.length === 1 ? 'sala' : 'salas'}` },
              { label: 'Reuniões hoje', value: view.todays.length, note: `${view.aComecar.length} ainda vão começar` },
              { label: 'Pessoas hoje', value: view.pessoasHoje },
              { label: 'Próximos 7 dias', value: view.proximos7, unit: view.proximos7 === 1 ? 'reunião' : 'reuniões' },
            ]}
          />

          {rooms.length === 0 ? (
            <EmptyState
              title="Nenhuma sala cadastrada"
              description="Cadastre as salas para acompanhar a ocupação do dia."
              action={
                <Link href="/salas" className="text-sm font-medium underline-offset-4 hover:underline">
                  Ir para Salas
                </Link>
              }
            />
          ) : (
            <Panel title="Ocupação de hoje" aside={<TodayStripLegend />}>
              <TodayStrip rooms={rooms} todays={view.todays} now={view.hhmm} />
            </Panel>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel
              title="Próximas reuniões"
              aside={
                view.upcoming.length > LIST_CAP && (
                  <Link href="/reservas" className="text-sm text-muted-foreground hover:text-foreground">
                    Ver todas ({view.upcoming.length})
                  </Link>
                )
              }
            >
              <UpcomingReservations reservations={view.upcoming.slice(0, LIST_CAP)} />
            </Panel>

            <Panel
              title="Livres agora"
              aside={
                view.free.length > LIST_CAP && (
                  <Link href="/salas" className="text-sm text-muted-foreground hover:text-foreground">
                    Ver todas ({view.free.length})
                  </Link>
                )
              }
            >
              <FreeRooms rooms={view.free.slice(0, LIST_CAP)} onReserve={onReserve} />
            </Panel>
          </div>
        </div>
      )}

    </div>
  )
}
