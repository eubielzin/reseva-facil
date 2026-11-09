'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, MapPin, Users } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'
import { corDoResultado } from '@/lib/business-rules'
import { checkinSchema, type CheckinFormValues } from '@/schemas/evento'
import { useLerIngresso } from '@/hooks/use-checkin'
import type { CheckinInfo, CheckinLeitura } from '@/types'
import { CameraLeitor } from './camera-leitor'
import { ResultadoCartao } from './resultado-cartao'

const TEMPO_CARTAO_MS = 3500

const VIBRACAO = { verde: [80], amarelo: [80, 60, 80], vermelho: [350] } as const

interface LeitorCheckinProps {
  info: CheckinInfo
  /** Link da equipe; o dono e o admin leem sem ele */
  codigoCheckin?: string
}

/** Leitor da porta: câmera + código digitado (ou leitor USB, que "digita" e dá Enter). */
export function LeitorCheckin({ info, codigoCheckin }: LeitorCheckinProps) {
  const ler = useLerIngresso()
  const [leitura, setLeitura] = useState<CheckinLeitura | null>(null)
  const [contagem, setContagem] = useState({ presentes: info.presentes, total: info.total })
  const form = useForm<CheckinFormValues>({ resolver: zodResolver(checkinSchema), defaultValues: { codigo: '' } })

  useEffect(() => {
    if (!leitura) return
    const t = setTimeout(() => setLeitura(null), TEMPO_CARTAO_MS)
    return () => clearTimeout(t)
  }, [leitura])

  function enviar(texto: string) {
    ler.mutate(
      { eventoId: info.evento_id, codigo: texto, codigoCheckin },
      {
        onSuccess: (r) => {
          setLeitura(r)
          setContagem({ presentes: r.presentes, total: r.total })
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([...VIBRACAO[corDoResultado(r.resultado)]])
          }
        },
      }
    )
  }

  function onSubmit(values: CheckinFormValues) {
    enviar(values.codigo)
    form.reset({ codigo: '' })
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{info.titulo}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDate(info.data)} · {formatTime(info.horario_inicio)}–{formatTime(info.horario_fim)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {info.sala_nome}
            </span>
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium">
          <Users className="h-4 w-4" />
          {contagem.presentes}/{contagem.total} presentes
        </p>
      </header>

      {!info.janela_aberta && (
        <p className="rounded-lg border border-warning/30 bg-pill-warning px-3 py-2 text-sm text-warning">
          O check-in abre às {info.abertura_checkin.slice(11, 16)} de {formatDate(info.abertura_checkin.slice(0, 10))} e
          fecha no fim do evento. Fora desse horário as leituras são recusadas.
        </p>
      )}

      {leitura ? <ResultadoCartao leitura={leitura} /> : null}

      <CameraLeitor onLer={enviar} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Digite o código (RF-XXXX-XXXX)"
                    autoComplete="off"
                    autoCapitalize="characters"
                    className="h-11 font-mono"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="h-11" disabled={ler.isPending}>
            Validar
          </Button>
        </form>
      </Form>
    </div>
  )
}
