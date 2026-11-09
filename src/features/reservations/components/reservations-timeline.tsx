'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { getReservationStatus } from '@/lib/utils'
import { useReservations } from '@/hooks/use-reservations'
import { TableSkeleton } from '@/components/loading-state'
import { NivelDot, NivelPill } from './nivel-evento'
import type { ReservationWithRoom } from '@/types'

const START_HOUR = 0
const END_HOUR = 23
const HOUR_HEIGHT = 56
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
const DAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function computeLayout(
  reservations: ReservationWithRoom[]
): Map<string, { left: number; width: number }> {
  const result = new Map<string, { left: number; width: number }>()
  const sorted = [...reservations].sort(
    (a, b) => timeToMinutes(a.horario_inicio) - timeToMinutes(b.horario_inicio)
  )

  const clusters: ReservationWithRoom[][] = []
  for (const r of sorted) {
    const rStart = timeToMinutes(r.horario_inicio)
    const rEnd = timeToMinutes(r.horario_fim)
    let placed = false
    for (const cluster of clusters) {
      const overlaps = cluster.some((c) => {
        const cStart = timeToMinutes(c.horario_inicio)
        const cEnd = timeToMinutes(c.horario_fim)
        return rStart < cEnd && rEnd > cStart
      })
      if (overlaps) { cluster.push(r); placed = true; break }
    }
    if (!placed) clusters.push([r])
  }

  // Dentro de cada grupo, cada reserva ocupa a primeira coluna livre;
  // a largura é dividida pelo número de colunas do grupo, não pelo de reservas
  for (const cluster of clusters) {
    const colEnds: number[] = []
    const colOf = new Map<string, number>()
    for (const r of cluster) {
      const start = timeToMinutes(r.horario_inicio)
      let col = colEnds.findIndex((end) => end <= start)
      if (col === -1) col = colEnds.length
      colEnds[col] = timeToMinutes(r.horario_fim)
      colOf.set(r.id, col)
    }
    const n = colEnds.length
    cluster.forEach((r) => {
      const i = colOf.get(r.id) ?? 0
      result.set(r.id, { left: (i / n) * 100, width: (1 / n) * 100 })
    })
  }

  return result
}

// O matiz das reservas marca o que ainda vai acontecer; encerradas ficam em cinza
function blockColors(r: ReservationWithRoom): string {
  // Pedido ainda não aprovado: contorno tracejado, sem preenchimento — não ocupa a sala
  if (r.status === 'pendente') return 'bg-card border-dashed border-warning text-foreground'
  const status = getReservationStatus(r)
  if (status === 'em_andamento') return 'bg-booked border-booked text-white'
  if (status === 'proxima') return 'bg-booked-soft border-transparent border-l-booked border-l-[3px] text-foreground'
  return 'bg-muted border-transparent text-muted-foreground'
}

const cap = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export function ReservationsTimeline() {
  const [baseDate, setBaseDate] = useState(() => new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithRoom | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: reservations = [], isLoading } = useReservations()

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const now = new Date()
  const nowTop = ((now.getHours() * 60 + now.getMinutes() - START_HOUR * 60) / 60) * HOUR_HEIGHT
  const showNowLine = nowTop >= 0 && nowTop <= TOTAL_HEIGHT

  useEffect(() => {
    if (scrollRef.current && showNowLine) {
      scrollRef.current.scrollTop = Math.max(0, nowTop - 80)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const byDay = useMemo(() => {
    const map: Record<string, ReservationWithRoom[]> = {}
    for (const r of reservations) {
      // Recusadas e canceladas não acontecem
      if (r.status === 'recusada' || r.status === 'cancelada') continue
      if (!map[r.data]) map[r.data] = []
      map[r.data].push(r)
    }
    return map
  }, [reservations])

  // Capitaliza apenas a primeira letra (date-fns ptBR retorna tudo minúsculo)
  const monthLabel = (() => {
    const s = format(weekStart, 'MMMM', { locale: ptBR })
    const e = format(days[6], 'MMMM', { locale: ptBR })
    const y = format(weekStart, 'yyyy')
    return s === e ? `${cap(s)} de ${y}` : `${cap(s)} – ${cap(e)} de ${y}`
  })()

  if (isLoading) return <TableSkeleton rows={6} cols={7} />

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Barra de navegação */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="outline" size="sm" onClick={() => setBaseDate(new Date())}>
          Hoje
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setBaseDate((d) => subWeeks(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setBaseDate((d) => addWeeks(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Seletor rápido — abre calendário */}
        <Popover
          open={calendarOpen}
          onOpenChange={(open) => {
            if (open) setCalendarMonth(weekStart)
            setCalendarOpen(open)
          }}
        >
          <PopoverTrigger className="flex items-center gap-1 text-sm font-medium hover:text-foreground/70 transition-colors">
            {monthLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={weekStart}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelect={(date) => {
                if (date) {
                  setBaseDate(date)
                  setCalendarOpen(false)
                }
              }}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Grade — scroll horizontal engloba cabeçalho + conteúdo juntos */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 56 + 7 * 88 }}>

          {/* Cabeçalho dos dias — fica acima do div com overflow-y, então nunca some */}
          <div className="flex border-b">
            <div className="w-14 shrink-0 border-r" />
            {days.map((day) => {
              const today = isToday(day)
              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className="flex-1 min-w-22 border-r last:border-r-0 flex flex-col items-center justify-center py-2 gap-0.5"
                >
                  <span className="text-xs text-muted-foreground">
                    {DAY_LABELS[day.getDay()]}
                  </span>
                  <div className={cn(
                    'h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold',
                    today ? 'bg-foreground text-background' : 'text-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conteúdo com scroll vertical */}
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '65dvh' }}>
            <div className="flex">

              {/* Coluna de horas — sticky left para scroll horizontal */}
              <div
                className="w-14 shrink-0 sticky left-0 z-10 bg-card border-r overflow-hidden"
                style={{ height: TOTAL_HEIGHT }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="absolute w-full pr-2 flex justify-end"
                    style={{ top: i === 0 ? 4 : (h - START_HOUR) * HOUR_HEIGHT - 8 }}
                  >
                    <span className="text-[11px] text-muted-foreground select-none">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Colunas dos dias */}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayReservations = byDay[dateStr] ?? []
                const layout = computeLayout(dayReservations)
                const today = isToday(day)
                const weekend = day.getDay() === 0 || day.getDay() === 6

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'flex-1 min-w-22 border-r last:border-r-0 relative',
                      weekend && 'bg-muted/40'
                    )}
                    style={{ height: TOTAL_HEIGHT }}
                  >
                    {/* Linhas de hora e meia-hora */}
                    {HOURS.map((h) => (
                      <div key={h} className="absolute w-full" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
                        <div className="border-t border-border/50 w-full" />
                        <div
                          className="border-t border-border/20 border-dashed w-full"
                          style={{ marginTop: HOUR_HEIGHT / 2 - 1 }}
                        />
                      </div>
                    ))}

                    {/* Linha do horário atual */}
                    {today && showNowLine && (
                      <div className="absolute w-full z-30 pointer-events-none" style={{ top: nowTop }}>
                        <div className="relative flex items-center">
                          <div className="absolute -left-1 h-2 w-2 rounded-full bg-booked -translate-y-1/2 z-10" />
                          <div className="w-full border-t border-booked" />
                        </div>
                      </div>
                    )}

                    {/* Blocos de reserva */}
                    {dayReservations.map((r) => {
                      const startMin = timeToMinutes(r.horario_inicio)
                      const endMin = timeToMinutes(r.horario_fim)
                      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
                      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 22)
                      const { left, width } = layout.get(r.id) ?? { left: 0, width: 100 }

                      return (
                        <div
                          key={r.id}
                          className={cn(
                            'absolute rounded-[4px] border px-1.5 py-0.5 overflow-hidden z-20 select-none cursor-pointer transition-[filter] hover:brightness-95',
                            blockColors(r)
                          )}
                          style={{
                            top: top + 1,
                            height: height - 2,
                            left: `calc(2px + ${left}%)`,
                            width: `calc(${width}% - 4px)`,
                          }}
                          onClick={() => setSelectedReservation(r)}
                        >
                          <p className="text-[11px] font-semibold leading-tight truncate flex items-center gap-1">
                            {r.nivel_evento && <NivelDot nivel={r.nivel_evento} className="h-1.5 w-1.5" />}
                            {r.titulo}
                          </p>
                          {height >= 34 && (
                            <p className="text-[11px] leading-tight opacity-90 truncate">{r.sala.nome}</p>
                          )}
                          {height >= 50 && (
                            <p className="text-[11px] leading-tight opacity-80">
                              {r.horario_inicio.slice(0, 5)}–{r.horario_fim.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda — cada amostra é a própria marca do bloco, em escala menor */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded-[3px] bg-booked" />
          <span>Em andamento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded-[3px] bg-booked-soft border-l-[3px] border-booked" />
          <span>Próxima</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded-[3px] bg-muted" />
          <span>Encerrada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded-[3px] bg-card border border-dashed border-warning" />
          <span>Pedido pendente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 rounded-[3px] bg-muted/40 border" />
          <span>Fim de semana</span>
        </div>
      </div>

      {/* Dialog de detalhes da reserva */}
      <Dialog
        open={!!selectedReservation}
        onOpenChange={(open) => { if (!open) setSelectedReservation(null) }}
      >
        <DialogContent className="max-w-sm" showCloseButton>
          {selectedReservation && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-2 pr-6">
                  <DialogTitle className="flex-1 leading-snug">
                    {selectedReservation.titulo}
                  </DialogTitle>
                  {selectedReservation.nivel_evento && (
                    <span className="mt-0.5">
                      <NivelPill nivel={selectedReservation.nivel_evento} />
                    </span>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-2.5 text-sm">
                {[
                  ['Sala', selectedReservation.sala.nome],
                  [
                    'Data',
                    cap(format(
                      new Date(selectedReservation.data + 'T12:00:00'),
                      "EEEE, dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR }
                    )),
                  ],
                  [
                    'Horário',
                    `${selectedReservation.horario_inicio.slice(0, 5)} – ${selectedReservation.horario_fim.slice(0, 5)}`,
                  ],
                  ['Responsável', selectedReservation.participante_responsavel],
                  [
                    'Participantes',
                    `${selectedReservation.quantidade_participantes} de ${selectedReservation.sala.capacidade} lugares`,
                  ],
                  ...(selectedReservation.nome_empresa
                    ? [['Empresa', selectedReservation.nome_empresa]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
