'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { editarEventoSchema, type EditarEventoFormValues } from '@/schemas/evento'
import { useEditarEvento } from '@/hooks/use-eventos'
import type { ReservationWithRoom } from '@/types'
import { EventoFields } from './evento-fields'

interface EditarEventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reserva: ReservationWithRoom
}

function valoresIniciais(reserva: ReservationWithRoom): EditarEventoFormValues {
  const e = reserva.evento
  return {
    evento: {
      visibilidade: e?.visibilidade ?? 'publico',
      descricao: e?.descricao ?? '',
      limite_ingressos: e?.limite_ingressos ?? 1,
      tags: e?.tags ?? [],
      checkin_minutos_antes: e?.checkin_minutos_antes ?? 60,
    },
  }
}

// Descrição, tags, visibilidade e limite — editáveis mesmo depois da aprovação (não mexem na sala)
export function EditarEventoDialog({ open, onOpenChange, reserva }: EditarEventoDialogProps) {
  const editar = useEditarEvento()
  const evento = reserva.evento
  const form = useForm<EditarEventoFormValues>({
    resolver: zodResolver(editarEventoSchema),
    defaultValues: valoresIniciais(reserva),
  })

  useEffect(() => {
    if (open && evento) {
      form.reset(valoresIniciais(reserva))
      editar.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evento])

  if (!evento) return null

  function onSubmit(values: EditarEventoFormValues) {
    editar.mutate({ reservaId: reserva.id, values: values.evento }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>
            {reserva.titulo}. Quem já pegou ingresso continua com a tag que escolheu.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <EventoFields capacidadeSala={reserva.sala.capacidade} ingressosEmitidos={evento.ingressos_emitidos} />
            {editar.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editar.error.message}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={editar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editar.isPending}>
                {editar.isPending ? 'Salvando...' : 'Salvar evento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
