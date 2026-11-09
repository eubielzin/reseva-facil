'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReservationStatusBadge } from './reservation-status-badge'
import { ReservationActions } from './reservation-actions'
import { NivelDot } from './nivel-evento'
import { useRole } from '@/hooks/use-role'
import { cn, formatDate, formatTime, getReservationStatus } from '@/lib/utils'
import type { ReservationWithRoom } from '@/types'

const HEAD = 'h-10 px-4 text-xs font-normal text-muted-foreground'
const CELL = 'px-4 py-2.5'

export function ReservationsTable({ reservations }: { reservations: ReservationWithRoom[] }) {
  const { isAdmin } = useRole()

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader className="[&_tr]:border-b-border">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(HEAD, 'sm:w-[34%]')}>Reunião</TableHead>
            <TableHead className={cn(HEAD, 'hidden md:table-cell')}>Sala</TableHead>
            <TableHead className={cn(HEAD, 'hidden sm:table-cell text-right')}>Data</TableHead>
            <TableHead className={cn(HEAD, 'text-right')}>
              <span className="sm:hidden">Quando</span>
              <span className="hidden sm:inline">Horário</span>
            </TableHead>
            <TableHead className={cn(HEAD, 'hidden lg:table-cell text-right')}>Pessoas</TableHead>
            <TableHead className={cn(HEAD, 'hidden sm:table-cell')}>Status</TableHead>
            {isAdmin && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((r) => {
            const status = getReservationStatus(r)
            return (
              <TableRow key={r.id} className="border-rule">
                <TableCell className={cn(CELL, 'max-w-[210px] sm:max-w-[280px]')}>
                  <p className={cn('flex items-center gap-2 font-medium truncate', status === 'encerrada' && 'max-sm:text-muted-foreground')}>
                    {r.nivel_evento && <NivelDot nivel={r.nivel_evento} />}
                    <span className="truncate">{r.titulo}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {r.participante_responsavel}
                    {r.nome_empresa ? ` · ${r.nome_empresa}` : ''}
                    <span className="md:hidden"> · {r.sala.nome}</span>
                  </p>
                </TableCell>
                <TableCell className={cn(CELL, 'hidden md:table-cell')}>{r.sala.nome}</TableCell>
                <TableCell className={cn(CELL, 'hidden sm:table-cell text-right')}>{formatDate(r.data)}</TableCell>
                <TableCell className={cn(CELL, 'text-right')}>
                  {/* No celular a coluna de status some: "Agora" no matiz diz que está em andamento */}
                  <span className={cn('block sm:hidden', status === 'em_andamento' && 'text-booked font-medium', status === 'encerrada' && 'text-muted-foreground')}>
                    {status === 'em_andamento' ? 'Agora' : formatDate(r.data).slice(0, 5)}
                  </span>
                  <span className="text-[13px] text-muted-foreground sm:text-sm sm:text-foreground">
                    {formatTime(r.horario_inicio)}–{formatTime(r.horario_fim)}
                  </span>
                </TableCell>
                <TableCell className={cn(CELL, 'hidden lg:table-cell text-right')}>
                  {r.quantidade_participantes}
                  <span className="text-muted-foreground"> / {r.sala.capacidade}</span>
                </TableCell>
                <TableCell className={cn(CELL, 'hidden sm:table-cell')}>
                  <ReservationStatusBadge reservation={r} />
                </TableCell>
                {isAdmin && (
                  <TableCell className="pr-2 text-right">
                    <ReservationActions reservation={r} />
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
