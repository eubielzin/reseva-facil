'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReservationForm } from './reservation-form'
import { useCreateReservation, useUpdateReservation } from '@/hooks/use-reservations'
import { useRooms } from '@/hooks/use-rooms'
import { useRole } from '@/hooks/use-role'
import type { ReservationWithRoom } from '@/types'
import type { ReservationFormValues } from '@/schemas/reservation'

interface ReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation?: ReservationWithRoom
  defaultSalaId?: string
}

export function ReservationDialog({
  open,
  onOpenChange,
  reservation,
  defaultSalaId,
}: ReservationDialogProps) {
  const { data: rooms = [] } = useRooms()
  const { isAdmin } = useRole()
  // Reserva de organizador é um pedido: só vale depois que o admin aprova
  const ehPedido = !reservation && !isAdmin
  const createReservation = useCreateReservation()
  const updateReservation = useUpdateReservation()

  const isLoading = createReservation.isPending || updateReservation.isPending
  const serverError = (createReservation.error ?? updateReservation.error)?.message

  function handleSubmit(values: ReservationFormValues) {
    if (reservation) {
      updateReservation.mutate(
        { id: reservation.id, values },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createReservation.mutate(values, { onSuccess: () => onOpenChange(false) })
    }
  }

  const defaultValues = reservation
    ?? (defaultSalaId ? ({ sala_id: defaultSalaId } as ReservationWithRoom) : undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-4.5rem)] max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reservation ? 'Editar reserva' : ehPedido ? 'Novo pedido de reserva' : 'Nova reserva'}
          </DialogTitle>
          {ehPedido && (
            <DialogDescription>
              O pedido fica pendente até a administração aprovar. Você recebe a resposta por email e nas notificações.
            </DialogDescription>
          )}
        </DialogHeader>
        <ReservationForm
          rooms={rooms}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
          serverError={serverError}
          submitLabel={reservation ? 'Salvar alterações' : ehPedido ? 'Enviar pedido' : 'Criar reserva'}
        />
      </DialogContent>
    </Dialog>
  )
}
