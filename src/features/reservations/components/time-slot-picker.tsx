'use client'

import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function generateSlots(fromHour = 8): string[] {
  const slots: string[] = []
  for (let h = fromHour; h <= 23; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

interface BookedInterval {
  horario_inicio: string
  horario_fim: string
}

function isSlotBooked(slot: string, bookings: BookedInterval[]): boolean {
  return bookings.some((b) => {
    const s = b.horario_inicio.slice(0, 5)
    const e = b.horario_fim.slice(0, 5)
    return s <= slot && slot <= e
  })
}

function rangeConflicts(start: string, end: string, bookings: BookedInterval[]): boolean {
  return bookings.some((b) => {
    const s = b.horario_inicio.slice(0, 5)
    const e = b.horario_fim.slice(0, 5)
    return start <= e && end >= s
  })
}

interface TimeSlotPickerProps {
  startTime: string
  endTime: string
  onStartChange: (time: string) => void
  onEndChange: (time: string) => void
  bookedIntervals: BookedInterval[]
  disabled?: boolean
  availableFrom?: string
}

function SlotButton({
  slot,
  selected,
  unavailable,
  onClick,
  disabled,
}: {
  slot: string
  selected: boolean
  unavailable: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled || unavailable}
      onClick={onClick}
      className={cn(
        'shrink-0 w-14 rounded-lg border py-1.5 text-xs font-medium transition-colors text-center',
        selected && 'bg-primary text-primary-foreground border-primary',
        !selected && !unavailable && 'border-input hover:bg-muted cursor-pointer',
        unavailable && 'border-border bg-muted/40 text-muted-foreground line-through cursor-not-allowed select-none'
      )}
    >
      {slot}
    </button>
  )
}

function SlotCarousel({
  children,
}: {
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  function scroll(direction: 'left' | 'right') {
    if (!ref.current) return
    ref.current.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => scroll('left')}
        className="shrink-0 rounded-md border border-input p-1 hover:bg-muted transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div ref={ref} className="flex-1 max-w-[242px] sm:max-w-76 overflow-hidden">
        <div className="flex gap-1.5 w-max">
          {children}
        </div>
      </div>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="shrink-0 rounded-md border border-input p-1 hover:bg-muted transition-colors"
      >
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}

export function TimeSlotPicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  bookedIntervals,
  disabled,
  availableFrom,
}: TimeSlotPickerProps) {
  const fromHour = availableFrom ? parseInt(availableFrom.split(':')[0]) : 8

  const allSlots = useMemo(() => generateSlots(fromHour), [fromHour])

  const startSlots = useMemo(
    () =>
      allSlots.map((slot) => ({
        slot,
        booked: isSlotBooked(slot, bookedIntervals),
        selected: slot === startTime,
      })),
    [allSlots, bookedIntervals, startTime]
  )

  const endSlots = useMemo(
    () =>
      startTime
        ? allSlots.filter((slot) => slot > startTime).map((slot) => ({
            slot,
            conflicted: rangeConflicts(startTime, slot, bookedIntervals),
            selected: slot === endTime,
          }))
        : [],
    [allSlots, startTime, endTime, bookedIntervals]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium leading-none">Início</p>
        <SlotCarousel>
          {startSlots.map(({ slot, booked, selected }) => (
            <SlotButton
              key={slot}
              slot={slot}
              selected={selected}
              unavailable={booked}
              disabled={disabled}
              onClick={() => {
                onStartChange(slot)
                if (endTime && endTime <= slot) onEndChange('')
              }}
            />
          ))}
        </SlotCarousel>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium leading-none">Fim</p>
        {!startTime ? (
          <p className="text-xs text-muted-foreground py-1">
            Selecione o horário de início primeiro.
          </p>
        ) : endSlots.length === 0 ? (
          <p className="text-xs text-muted-foreground py-1">
            Nenhum horário disponível após {startTime}.
          </p>
        ) : (
          <SlotCarousel>
            {endSlots.map(({ slot, conflicted, selected }) => (
              <SlotButton
                key={slot}
                slot={slot}
                selected={selected}
                unavailable={conflicted}
                disabled={disabled}
                onClick={() => onEndChange(slot)}
              />
            ))}
          </SlotCarousel>
        )}
      </div>
    </div>
  )
}
