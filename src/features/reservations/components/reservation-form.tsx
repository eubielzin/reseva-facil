'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, CalendarIcon } from 'lucide-react'
import {
  reservationFormSchema,
  type ReservationFormValues,
  type ReservationFormInternalValues,
} from '@/schemas/reservation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/use-role'
import { useRoomSchedule } from '@/hooks/use-reservations'
import { TimeSlotPicker } from './time-slot-picker'
import type { ReservationWithRoom, Room } from '@/types'

const CICLO_NIVEIS = ['baixa', 'media', 'alta'] as const
const NIVEL_LABELS: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const NIVEL_DOT_CLASS: Record<string, string> = {
  baixa: 'bg-emerald-500',
  media: 'bg-amber-500',
  alta: 'bg-red-500',
}

interface ReservationFormProps {
  rooms: Room[]
  defaultValues?: ReservationWithRoom
  onSubmit: (values: ReservationFormValues) => void
  isLoading?: boolean
  onCancel: () => void
  serverError?: string
}

export function ReservationForm({
  rooms,
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
  serverError,
}: ReservationFormProps) {
  const form = useForm<ReservationFormInternalValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      sala_id: defaultValues?.sala_id ?? '',
      titulo: defaultValues?.titulo ?? '',
      participante_responsavel: defaultValues?.participante_responsavel ?? '',
      quantidade_participantes: defaultValues?.quantidade_participantes ?? ('' as unknown as number),
      data: defaultValues?.data ?? '',
      horario_inicio: defaultValues?.horario_inicio?.slice(0, 5) ?? '',
      horario_fim: defaultValues?.horario_fim?.slice(0, 5) ?? '',
      is_empresa: !!defaultValues?.nome_empresa,
      nome_empresa: defaultValues?.nome_empresa ?? null,
      nivel_evento: defaultValues?.nivel_evento ?? null,
    },
  })

  const { isAdmin } = useRole()

  const selectedSalaId = form.watch('sala_id')
  const selectedData = form.watch('data')
  const horarioInicio = form.watch('horario_inicio')
  const horarioFim = form.watch('horario_fim')
  const isEmpresa = form.watch('is_empresa')
  const selectedRoom = rooms.find((r) => r.id === selectedSalaId)

  const { data: scheduleReservations = [] } = useRoomSchedule(selectedSalaId || undefined, selectedData)
  const bookedIntervals = useMemo(
    () => scheduleReservations.filter((r) => r.id !== defaultValues?.id),
    [scheduleReservations, defaultValues?.id]
  )

  const availableFrom = selectedRoom?.disponivel_madrugada ? '00:00' : '08:00'

  // Limpa nome_empresa quando desmarca "é empresa"
  useEffect(() => {
    if (!isEmpresa) {
      form.setValue('nome_empresa', null)
    }
  }, [isEmpresa, form])

  useEffect(() => {
    if (!selectedRoom || selectedRoom.disponivel_fim_de_semana || !selectedData) return
    const dayOfWeek = new Date(selectedData + 'T12:00:00').getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      form.setValue('data', '')
    }
  }, [selectedRoom, selectedData, form])

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        sala_id: defaultValues.sala_id,
        titulo: defaultValues.titulo,
        participante_responsavel: defaultValues.participante_responsavel,
        quantidade_participantes: defaultValues.quantidade_participantes,
        data: defaultValues.data,
        horario_inicio: defaultValues.horario_inicio?.slice(0, 5) ?? '',
        horario_fim: defaultValues.horario_fim?.slice(0, 5) ?? '',
        is_empresa: !!defaultValues.nome_empresa,
        nome_empresa: defaultValues.nome_empresa ?? null,
        nivel_evento: defaultValues.nivel_evento ?? null,
      })
    }
  }, [defaultValues, form])

  function handleFormSubmit(values: ReservationFormInternalValues) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { is_empresa, ...rest } = values
    onSubmit({
      ...rest,
      nome_empresa: is_empresa ? (rest.nome_empresa ?? null) : null,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Sala + checkbox empresa na mesma linha */}
        <div className="flex items-end gap-4">
          <FormField
            control={form.control}
            name="sala_id"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Sala</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <span className={cn('flex-1 truncate text-left text-sm', !selectedRoom && 'text-muted-foreground')}>
                        {selectedRoom
                          ? `${selectedRoom.nome} — ${selectedRoom.capacidade} pessoa${selectedRoom.capacidade !== 1 ? 's' : ''}`
                          : 'Selecione uma sala'}
                      </span>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.nome} — {room.capacidade} pessoa{room.capacidade !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_empresa"
            render={({ field }) => (
              <FormItem className="pr-5 flex items-center gap-2 pb-2 shrink-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer leading-none">
                  Empresa
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {isEmpresa && (
          <FormField
            control={form.control}
            name="nome_empresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da empresa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Acme Ltda."
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Reunião de planejamento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isAdmin && (
          <FormField
            control={form.control}
            name="nivel_evento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível do evento</FormLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant={!field.value ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => field.onChange(null)}
                  >
                    <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                    Sem evento
                  </Button>
                  {CICLO_NIVEIS.map((nivel) => {
                    const active = field.value === nivel
                    return (
                      <Button
                        key={nivel}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => field.onChange(active ? null : nivel)}
                      >
                        <span className={cn('h-2 w-2 rounded-full shrink-0', NIVEL_DOT_CLASS[nivel])} />
                        {NIVEL_LABELS[nivel]}
                      </Button>
                    )
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="participante_responsavel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável</FormLabel>
              <FormControl>
                <Input placeholder="Nome do responsável" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantidade_participantes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nº de participantes</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={selectedRoom?.capacidade}
                  placeholder="Ex: 5"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              {selectedRoom && (
                <FormDescription>
                  Capacidade máxima da sala: <strong>{selectedRoom.capacidade} pessoa{selectedRoom.capacidade !== 1 ? 's' : ''}</strong>
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value
                      ? format(new Date(field.value + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecione uma data'}
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                    onSelect={(date) =>
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                    }
                    locale={ptBR}
                    disabled={[
                      { before: startOfToday() },
                      ...(selectedRoom && !selectedRoom.disponivel_fim_de_semana
                        ? [{ dayOfWeek: [0, 6] as number[] }]
                        : []),
                    ]}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1.5">
          <TimeSlotPicker
            startTime={horarioInicio}
            endTime={horarioFim}
            bookedIntervals={bookedIntervals}
            disabled={isLoading}
            availableFrom={availableFrom}
            onStartChange={(t) => {
              form.setValue('horario_inicio', t, { shouldValidate: true, shouldDirty: true })
              form.setValue('horario_fim', '', { shouldDirty: true })
            }}
            onEndChange={(t) =>
              form.setValue('horario_fim', t, { shouldValidate: true, shouldDirty: true })
            }
          />
          {(form.formState.errors.horario_inicio || form.formState.errors.horario_fim) && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.horario_inicio?.message ??
                form.formState.errors.horario_fim?.message}
            </p>
          )}
        </div>

        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Salvando...'
              : defaultValues
              ? 'Salvar alterações'
              : 'Criar reserva'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
