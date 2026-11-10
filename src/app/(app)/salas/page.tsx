'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { RoomsTable } from '@/features/rooms/components/rooms-table'
import { RoomDialog } from '@/features/rooms/components/room-dialog'
import { RoomCard, RoomCardSkeleton } from '@/features/rooms/components/room-card'
import { ReservationDialog } from '@/features/reservations/components/reservation-dialog'
import { podeCriarReserva } from '@/lib/business-rules'
import { cn } from '@/lib/utils'
import { useRooms } from '@/hooks/use-rooms'
import { useOcupacao } from '@/hooks/use-reservations'
import { useRole } from '@/hooks/use-role'
import { useNow } from '@/hooks/use-now'
import { nowString, reservationsOn, roomNow, todayString, type RoomNow } from '@/lib/occupancy'

type Visao = 'cards' | 'lista'
const VISAO_KEY = 'salas:visao'

// Preferência só deste navegador; sem storage, fica nos cards
function useVisao(): [Visao, (v: Visao) => void] {
  const [visao, setVisao] = useState<Visao>('cards')
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no browser
      if (localStorage.getItem(VISAO_KEY) === 'lista') setVisao('lista')
    } catch {}
  }, [])
  function trocar(v: Visao) {
    setVisao(v)
    try {
      localStorage.setItem(VISAO_KEY, v)
    } catch {}
  }
  return [visao, trocar]
}

export default function SalasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [reservarSalaId, setReservarSalaId] = useState<string | null>(null)
  const [visao, setVisao] = useVisao()
  const { data: rooms, isLoading, isError, refetch } = useRooms()
  const { isAdmin, papel } = useRole()
  const podeReservar = podeCriarReserva(papel)
  const now = useNow()
  // Ocupação de todos os usuários: "em uso agora" vale mesmo para quem só vê as próprias reservas
  const { data: ocupacao } = useOcupacao(todayString(now))

  const todays = useMemo(() => (ocupacao ? reservationsOn(todayString(now), ocupacao) : undefined), [ocupacao, now])

  const roomStates = useMemo(() => {
    if (!rooms || !todays) return undefined
    const hhmm = nowString(now)
    return Object.fromEntries(rooms.map((r) => [r.id, roomNow(r.id, todays, hhmm)])) as Record<string, RoomNow>
  }, [rooms, todays, now])

  const summary = useMemo(() => {
    if (!rooms || rooms.length === 0) return undefined
    const lugares = rooms.reduce((sum, r) => sum + r.capacidade, 0)
    const emUso = roomStates ? Object.values(roomStates).filter((s) => s.kind === 'em_uso').length : null
    return [
      `${rooms.length} ${rooms.length === 1 ? 'sala' : 'salas'}`,
      `${lugares} lugares no total`,
      emUso !== null && `${emUso} em uso agora`,
    ].filter(Boolean).join(' · ')
  }, [rooms, roomStates])

  const newRoomButton = isAdmin ? (
    <Button size="lg" onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4" />
      Nova sala
    </Button>
  ) : undefined

  return (
    <div>
      <PageHeader title="Salas" description={summary} action={newRoomButton} />

      {rooms && rooms.length > 0 && (
        <div className="mb-4 flex justify-end">
          <div role="group" aria-label="Modo de exibição" className="flex h-8 items-center gap-0.5 rounded-md bg-muted p-0.5">
            {([
              { valor: 'cards', label: 'Cards', icon: LayoutGrid },
              { valor: 'lista', label: 'Lista', icon: List },
            ] as const).map(({ valor, label, icon: Icon }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={visao === valor}
                onClick={() => setVisao(valor)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  visao === valor ? 'bg-card text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (visao === 'lista' ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <RoomCardSkeleton key={i} />)}
        </div>
      ))}

      {isError && (
        <ErrorState
          message="Não foi possível carregar as salas."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && rooms?.length === 0 && (
        <EmptyState
          title="Nenhuma sala cadastrada"
          description={
            isAdmin
              ? 'Cadastre a primeira sala para começar a receber reservas.'
              : 'Um administrador ainda precisa cadastrar as salas.'
          }
          action={newRoomButton}
        />
      )}

      {!isLoading && !isError && rooms && rooms.length > 0 && (visao === 'lista' ? (
        <RoomsTable rooms={rooms} now={roomStates} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room, i) => (
            <RoomCard
              key={room.id}
              room={room}
              posicao={i}
              state={roomStates?.[room.id]}
              todays={todays}
              now={nowString(now)}
              isAdmin={isAdmin}
              onReservar={podeReservar ? () => setReservarSalaId(room.id) : undefined}
            />
          ))}
        </div>
      ))}

      {isAdmin && <RoomDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {podeReservar && (
        <ReservationDialog
          open={reservarSalaId !== null}
          onOpenChange={(open) => !open && setReservarSalaId(null)}
          defaultSalaId={reservarSalaId ?? undefined}
        />
      )}
    </div>
  )
}
