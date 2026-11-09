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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { recusaSchema, type RecusaFormValues } from '@/schemas/decisao'
import { useMudarStatusReserva } from '@/hooks/use-reservations'

interface RecusarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservaId: string
  titulo: string
}

// Recusa de pedido com motivo opcional — o motivo vai no email e na notificação do organizador
export function RecusarDialog({ open, onOpenChange, reservaId, titulo }: RecusarDialogProps) {
  const mudarStatus = useMudarStatusReserva()
  const form = useForm<RecusaFormValues>({
    resolver: zodResolver(recusaSchema),
    defaultValues: { motivo: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({ motivo: '' })
      mudarStatus.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(values: RecusaFormValues) {
    mudarStatus.mutate(
      { id: reservaId, acao: 'recusar', motivo: values.motivo },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recusar pedido</DialogTitle>
          <DialogDescription>
            O organizador de “{titulo}” recebe a recusa por email e no app.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ex.: a sala estará em manutenção nesse dia." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mudarStatus.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{mudarStatus.error.message}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mudarStatus.isPending}>
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={mudarStatus.isPending}>
                {mudarStatus.isPending ? 'Recusando...' : 'Recusar pedido'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
