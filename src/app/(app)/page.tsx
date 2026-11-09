'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Inbox } from 'lucide-react'
import { TodayOverview } from '@/features/dashboard/components/today-overview'
import { ReservationDialog } from '@/features/reservations/components/reservation-dialog'
import { useReservations } from '@/hooks/use-reservations'
import { useRooms } from '@/hooks/use-rooms'
import { useRole } from '@/hooks/use-role'
import { useNow } from '@/hooks/use-now'
import { bloqueiaHorario } from '@/lib/business-rules'

export default function HojePage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useRole()
  const rooms = useRooms()
  const reservations = useReservations()
  const now = useNow()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogSalaId, setDialogSalaId] = useState<string | undefined>()

  // Ocupação real das salas: só reservas aprovadas (pendentes ainda não seguram a sala)
  const ocupando = useMemo(
    () => reservations.data?.filter((r) => bloqueiaHorario(r.status)),
    [reservations.data]
  )
  const pendentes = reservations.data?.filter((r) => r.status === 'pendente').length ?? 0
  const cancelamentos = reservations.data?.filter((r) => r.status === 'cancelamento_solicitado').length ?? 0

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace('/reservas')
    }
  }, [isLoaded, isAdmin, router])

  if (!isLoaded || !isAdmin) return null

  function openDialog(salaId?: string) {
    setDialogSalaId(salaId)
    setDialogOpen(true)
  }

  return (
    <>
      {(pendentes > 0 || cancelamentos > 0) && (
        <Link
          href="/pedidos"
          className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-pill-warning px-4 py-3 text-sm text-warning transition-colors hover:border-warning/60"
        >
          <Inbox className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {[
              pendentes > 0 && `${pendentes} ${pendentes === 1 ? 'pedido pendente' : 'pedidos pendentes'}`,
              cancelamentos > 0 &&
                `${cancelamentos} ${cancelamentos === 1 ? 'cancelamento solicitado' : 'cancelamentos solicitados'}`,
            ]
              .filter(Boolean)
              .join(' · ')}{' '}
            aguardando a sua decisão
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      )}

      <TodayOverview
        rooms={rooms.data}
        reservations={ocupando}
        now={now}
        isLoading={rooms.isLoading || reservations.isLoading}
        isError={rooms.isError || reservations.isError}
        onRetry={() => { rooms.refetch(); reservations.refetch() }}
        onReserve={openDialog}
      />

      <ReservationDialog
        key={dialogSalaId ?? 'nova'}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultSalaId={dialogSalaId}
      />
    </>
  )
}
