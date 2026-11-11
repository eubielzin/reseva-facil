'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Ticket } from 'lucide-react'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { ingressoSchema, type IngressoFormValues } from '@/schemas/evento'
import { usePegarIngresso } from '@/hooks/use-eventos'
import type { EventoPublico } from '@/types'

/** Escolha da tag (uma só) e confirmação. A tag escolhida vai no QR code. */
export function PegarIngressoForm({ evento, convite }: { evento: EventoPublico; convite?: string }) {
  const pegar = usePegarIngresso()
  const form = useForm<IngressoFormValues>({
    resolver: zodResolver(ingressoSchema),
    defaultValues: { tag: evento.tags.length === 1 ? evento.tags[0] : '' },
  })

  function onSubmit(values: IngressoFormValues) {
    pegar.mutate({ eventoId: evento.id, tag: values.tag, convite })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Você vai como</FormLabel>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {evento.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    role="radio"
                    aria-checked={field.value === tag}
                    onClick={() => field.onChange(tag)}
                    className={cn(
                      'h-11 rounded-lg border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      field.value === tag
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-input bg-card hover:bg-muted/50'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {pegar.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{pegar.error.message}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pegar.isPending}>
          <Ticket className="h-4 w-4" />
          {pegar.isPending ? 'Garantindo…' : 'Pegar ingresso'}
        </Button>
      </form>
    </Form>
  )
}
