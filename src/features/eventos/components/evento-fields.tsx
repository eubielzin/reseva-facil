'use client'

import { useFormContext } from 'react-hook-form'
import { Globe, Lock } from 'lucide-react'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { EventoFormValues } from '@/schemas/evento'
import { TagsEditor } from './tags-editor'

const VISIBILIDADES = [
  { valor: 'publico', label: 'Público', descricao: 'Aparece na vitrine de eventos', icon: Globe },
  { valor: 'privado', label: 'Privado', descricao: 'Só entra quem tiver o link', icon: Lock },
] as const

/**
 * Campos do evento com ingressos. Usado no pedido de reserva e em "Editar evento":
 * os dois formulários guardam os valores em evento.* e envolvem este bloco em <Form>.
 */
export function EventoFields({ capacidadeSala, ingressosEmitidos = 0 }: {
  capacidadeSala?: number
  ingressosEmitidos?: number
}) {
  const { control } = useFormContext<{ evento: EventoFormValues }>()

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="evento.visibilidade"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quem pode pegar ingresso</FormLabel>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {VISIBILIDADES.map(({ valor, label, descricao, icon: Icon }) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={field.value === valor}
                  onClick={() => field.onChange(valor)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    field.value === valor ? 'border-foreground bg-muted/60' : 'border-input hover:bg-muted/40'
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">{descricao}</span>
                  </span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="evento.descricao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição (opcional)</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="O que vai acontecer, para quem é, o que levar…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="evento.limite_ingressos"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite de ingressos</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={Math.max(1, ingressosEmitidos)}
                max={capacidadeSala}
                className="max-w-40"
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormDescription>
              {capacidadeSala ? `Até ${capacidadeSala}, a capacidade da sala.` : 'No máximo a capacidade da sala.'}
              {ingressosEmitidos > 0 && ` Já foram emitidos ${ingressosEmitidos}.`}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="evento.checkin_minutos_antes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Check-in abre quantos minutos antes</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={1440}
                step={5}
                className="max-w-40"
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormDescription>Padrão: 60. O check-in fecha no fim do evento.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="evento.tags"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormDescription>
              Quem pegar o ingresso escolhe uma delas, e ela vai no QR code. Clique para desmarcar.
            </FormDescription>
            <TagsEditor value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
