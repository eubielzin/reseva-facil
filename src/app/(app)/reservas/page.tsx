'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { Plus, CalendarDays, List, CalendarRange, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { ReservationsTable } from '@/features/reservations/components/reservations-table'
import { ReservationsFilters } from '@/features/reservations/components/reservations-filters'
import { ReservationDialog } from '@/features/reservations/components/reservation-dialog'
import { ReservationsTimeline } from '@/features/reservations/components/reservations-timeline'
import { ImportReservationsDialog } from '@/features/reservations/components/import-reservations-dialog'
import { useReservations } from '@/hooks/use-reservations'
import { useRooms } from '@/hooks/use-rooms'
import { useRole } from '@/hooks/use-role'
import { getReservationStatus, cn } from '@/lib/utils'
import { type SortOrder } from '@/features/reservations/components/reservations-filters'

type ViewMode = 'lista' | 'timeline'

export default function ReservasPage() {
  const { isAdmin } = useRole()
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [selectedSalaId, setSelectedSalaId] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const { data: rooms = [] } = useRooms()
  const { data: reservations, isLoading, isError, refetch } = useReservations(
    selectedSalaId || undefined
  )

  const filteredReservations = useMemo(() => {
    if (!reservations) return []
    const dir = sortOrder === 'asc' ? 1 : -1
    let list = [...reservations].sort((a, b) => {
      const dateCmp = a.data.localeCompare(b.data)
      if (dateCmp !== 0) return dateCmp * dir
      return a.horario_inicio.localeCompare(b.horario_inicio) * dir
    })

    if (dateRange?.from) {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd')
      list = list.filter((r) => r.data >= fromStr)
    }
    if (dateRange?.to) {
      const toStr = format(dateRange.to, 'yyyy-MM-dd')
      list = list.filter((r) => r.data <= toStr)
    }

    if (selectedStatus) {
      list = list.filter((r) => getReservationStatus(r) === selectedStatus)
    }

    return list
  }, [reservations, dateRange, selectedStatus, sortOrder])

  const hasFilters = selectedSalaId || dateRange || selectedStatus

  return (
    <div>
      <PageHeader
        title="Reservas"
        description="Gerencie as reservas de salas de reunião."
        action={
          <div className="flex items-center gap-2">
            {/* Toggle de visualização — apenas admin */}
            {isAdmin && (
              <div className="flex rounded-md border border-input overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('lista')}
                  className={cn(
                    'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
                    viewMode === 'lista'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={cn(
                    'px-3 py-1.5 text-sm flex items-center gap-1.5 border-l border-input transition-colors',
                    viewMode === 'timeline'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                >
                  <CalendarRange className="h-4 w-4" />
                  <span className="hidden sm:inline">Timeline</span>
                </button>
              </div>
            )}

            {isAdmin && (
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar planilha
              </Button>
            )}
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova reserva
            </Button>
          </div>
        }
      />

      {isAdmin && viewMode === 'timeline' ? (
        <ReservationsTimeline />
      ) : (
        <>
          <ReservationsFilters
            rooms={rooms}
            selectedSalaId={selectedSalaId}
            onSalaChange={setSelectedSalaId}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />

          {isLoading && <TableSkeleton rows={5} cols={5} />}

          {isError && (
            <ErrorState
              message="Não foi possível carregar as reservas."
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && filteredReservations.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma reserva encontrada"
              description={
                hasFilters
                  ? 'Nenhuma reserva corresponde aos filtros selecionados. Tente outros critérios.'
                  : 'Crie sua primeira reserva para começar.'
              }
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova reserva
                </Button>
              }
            />
          )}

          {!isLoading && !isError && filteredReservations.length > 0 && (
            <ReservationsTable reservations={filteredReservations} />
          )}
        </>
      )}

      <ReservationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultSalaId={selectedSalaId || undefined}
      />

      <ImportReservationsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        rooms={rooms}
      />
    </div>
  )
}
