'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { RoomsTable } from '@/features/rooms/components/rooms-table'
import { RoomDialog } from '@/features/rooms/components/room-dialog'
import { useRooms } from '@/hooks/use-rooms'
import { useOcupacao } from '@/hooks/use-reservations'
import { useRole } from '@/hooks/use-role'
import { useNow } from '@/hooks/use-now'
import { nowString, reservationsOn, roomNow, todayString, type RoomNow } from '@/lib/occupancy'

export default function SalasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: rooms, isLoading, isError, refetch } = useRooms()
  const { isAdmin } = useRole()
  const now = useNow()
  // Ocupação de todos os usuários: "em uso agora" vale mesmo para quem só vê as próprias reservas
  const { data: ocupacao } = useOcupacao(todayString(now))

  const roomStates = useMemo(() => {
    if (!rooms || !ocupacao) return undefined
    const todays = reservationsOn(todayString(now), ocupacao)
    const hhmm = nowString(now)
    return Object.fromEntries(rooms.map((r) => [r.id, roomNow(r.id, todays, hhmm)])) as Record<string, RoomNow>
  }, [rooms, ocupacao, now])

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

      {isLoading && <TableSkeleton rows={4} cols={4} />}

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

      {!isLoading && !isError && rooms && rooms.length > 0 && (
        <RoomsTable rooms={rooms} now={roomStates} />
      )}

      {isAdmin && <RoomDialog open={createOpen} onOpenChange={setCreateOpen} />}
    </div>
  )
}
