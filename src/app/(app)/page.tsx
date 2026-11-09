'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TodayOverview } from '@/features/dashboard/components/today-overview'
import { ReservationDialog } from '@/features/reservations/components/reservation-dialog'
import { useReservations } from '@/hooks/use-reservations'
import { useRooms } from '@/hooks/use-rooms'
import { useRole } from '@/hooks/use-role'
import { useNow } from '@/hooks/use-now'

export default function HojePage() {
  const router = useRouter()
  const { isAdmin, isLoaded } = useRole()
  const rooms = useRooms()
  const reservations = useReservations()
  const now = useNow()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogSalaId, setDialogSalaId] = useState<string | undefined>()

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
      <TodayOverview
        rooms={rooms.data}
        reservations={reservations.data}
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
