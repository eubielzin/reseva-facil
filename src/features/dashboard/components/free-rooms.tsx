import { Button } from '@/components/ui/button'
import type { RoomNow } from '@/lib/occupancy'
import type { Room } from '@/types'

interface FreeRoomsProps {
  rooms: { room: Room; state: Extract<RoomNow, { kind: 'livre' }> }[]
  onReserve: (salaId: string) => void
}

// Salas livres neste minuto, por quanto tempo, e a ação de reservar na própria linha
export function FreeRooms({ rooms, onReserve }: FreeRoomsProps) {
  if (rooms.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground">
        Todas as salas estão em uso neste momento.
      </p>
    )
  }

  return (
    <ul>
      {rooms.map(({ room, state }) => (
        <li key={room.id} className="flex items-center justify-between gap-4 border-t border-rule py-2.5 first:border-t-0 first:pt-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{room.nome}</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {room.capacidade} {room.capacidade === 1 ? 'lugar' : 'lugares'} ·{' '}
              {state.ate ? `livre até ${state.ate}` : 'livre o resto do dia'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onReserve(room.id)}>
            Reservar
          </Button>
        </li>
      ))}
    </ul>
  )
}
