'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoomActions } from './room-actions'
import { useRole } from '@/hooks/use-role'
import { cn } from '@/lib/utils'
import { roomHours, type RoomNow } from '@/lib/occupancy'
import type { Room } from '@/types'

const HEAD = 'h-10 px-4 text-xs font-normal text-muted-foreground'
const CELL = 'px-4 h-12'

function NowCell({ state }: { state?: RoomNow }) {
  if (!state) return <span className="text-muted-foreground">—</span>
  if (state.kind === 'em_uso') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-booked" />
        <span className="text-booked font-medium">Em uso</span>
        <span className="text-muted-foreground">até {state.ate}</span>
      </span>
    )
  }
  return (
    <span>
      Livre <span className="text-muted-foreground">{state.ate ? `até ${state.ate}` : 'o resto do dia'}</span>
    </span>
  )
}

export function RoomsTable({ rooms, now }: { rooms: Room[]; now?: Record<string, RoomNow> }) {
  const { isAdmin } = useRole()

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader className="[&_tr]:border-b-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(HEAD, 'w-[32%]')}>Sala</TableHead>
            <TableHead className={HEAD}>Agora</TableHead>
            <TableHead className={cn(HEAD, 'text-right')}>Capacidade</TableHead>
            <TableHead className={cn(HEAD, 'hidden md:table-cell')}>Aceita reservas</TableHead>
            {isAdmin && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id} className="border-rule">
              <TableCell className={cn(CELL, 'font-medium')}>{room.nome}</TableCell>
              <TableCell className={CELL}>
                <NowCell state={now?.[room.id]} />
              </TableCell>
              <TableCell className={cn(CELL, 'text-right')}>
                {room.capacidade}
                <span className="text-muted-foreground"> {room.capacidade === 1 ? 'lugar' : 'lugares'}</span>
              </TableCell>
              <TableCell className={cn(CELL, 'hidden md:table-cell text-muted-foreground')}>
                {roomHours(room)}
              </TableCell>
              {isAdmin && (
                <TableCell className="pr-2 text-right">
                  <RoomActions room={room} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
