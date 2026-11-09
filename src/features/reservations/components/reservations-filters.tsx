'use client'

import { X, CalendarIcon, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type DateRange } from 'react-day-picker'
import { Button, buttonVariants } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ReservationStatus, Room } from '@/types'

const STATUS_OPTIONS: { value: ReservationStatus; label: string }[] = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'proxima', label: 'Próxima' },
  { value: 'encerrada', label: 'Encerrada' },
]

export type SortOrder = 'asc' | 'desc'

// Sentinel interno — evita que Base UI alterne entre controlado e não-controlado
const ALL = '*'

interface ReservationsFiltersProps {
  rooms: Room[]
  selectedSalaId: string
  onSalaChange: (salaId: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  sortOrder: SortOrder
  onSortChange: (order: SortOrder) => void
}

export function ReservationsFilters({
  rooms,
  selectedSalaId,
  onSalaChange,
  dateRange,
  onDateRangeChange,
  selectedStatus,
  onStatusChange,
  sortOrder,
  onSortChange,
}: ReservationsFiltersProps) {
  const hasFilters = selectedSalaId || dateRange || selectedStatus

  const selectedRoom = rooms.find((r) => r.id === selectedSalaId)
  const selectedStatusLabel = STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label

  // Converte para o sentinel interno e de volta para o valor externo
  const salaValue = selectedSalaId || ALL
  const statusValue = selectedStatus || ALL

  function formatRange() {
    if (!dateRange?.from) return null
    if (!dateRange.to) return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
    return `${format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} — ${format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}`
  }

  return (
    <div className="grid grid-cols-2 items-end gap-3 mb-4 sm:flex sm:flex-wrap">
      {/* Filtro por sala */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Sala</span>
        <Select
          value={salaValue}
          onValueChange={(v) => onSalaChange(v === ALL ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <span className={cn('flex-1 truncate text-left text-sm', !selectedRoom && 'text-muted-foreground')}>
              {selectedRoom ? selectedRoom.nome : 'Todas as salas'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as salas</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por período com "x" para limpar */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Período</span>
        <Popover>
          <PopoverTrigger
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'h-8 w-full sm:w-[220px] justify-start text-left font-normal text-sm',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{formatRange() ?? 'Selecionar período'}</span>
            {dateRange && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  onDateRangeChange(undefined)
                }}
                className="ml-1 rounded-sm p-0.5 hover:bg-accent"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              locale={ptBR}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Filtro por status */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <Select
          value={statusValue}
          onValueChange={(v) => onStatusChange(v === ALL ? '' : (v ?? ''))}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <span className={cn('flex-1 truncate text-left text-sm', !selectedStatus && 'text-muted-foreground')}>
              {selectedStatusLabel ?? 'Todos'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ordenação por horário */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Ordenação</span>
        <Select value={sortOrder} onValueChange={(v) => onSortChange((v ?? 'asc') as SortOrder)}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-left text-sm">
              {sortOrder === 'asc' ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Mais antigo primeiro</SelectItem>
            <SelectItem value="desc">Mais recente primeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { onSalaChange(''); onDateRangeChange(undefined); onStatusChange('') }}
          className="h-8 px-2 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
