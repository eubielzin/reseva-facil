'use client'

import { useEffect, useRef } from 'react'
import { cn, formatTime } from '@/lib/utils'
import type { ReservationWithRoom, Room } from '@/types'

const MIN_TRACK = 640 // px — abaixo disso a faixa rola dentro da própria moldura
const NAME_COL = 'w-[112px] sm:w-[168px]' // coluna fixa com o nome das salas

function toMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

interface TodayStripProps {
  rooms: Room[]
  todays: ReservationWithRoom[] // reservas de hoje, já ordenadas
  now: string // HH:mm
}

// Hoje, sala por sala: salas nas linhas, horas nas colunas, reservas como barras
export function TodayStrip({ rooms, todays, now }: TodayStripProps) {
  const nowMin = toMinutes(now)

  // Janela do dia: 08:00–20:00, ampliada até a primeira e a última reserva; passos de 2 h
  const first = Math.min(8 * 60, ...todays.map((r) => toMinutes(r.horario_inicio)))
  const last = Math.max(20 * 60, ...todays.map((r) => toMinutes(r.horario_fim)))
  const startH = Math.floor(first / 120) * 2
  const endH = Math.min(24, Math.ceil(last / 120) * 2)
  const span = (endH - startH) * 60
  const pct = (min: number) => ((min - startH * 60) / span) * 100
  const ticks = Array.from({ length: (endH - startH) / 2 + 1 }, (_, i) => startH + i * 2)
  const showNow = nowMin >= startH * 60 && nowMin <= endH * 60

  // Em telas estreitas a faixa rola; abre com o "agora" à vista
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowPct = pct(nowMin)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth || !showNow) return
    const track = el.scrollWidth - (el.firstElementChild?.firstElementChild?.firstElementChild?.clientWidth ?? 0)
    el.scrollLeft = Math.max(0, (nowPct / 100) * track - el.clientWidth / 3)
  }, [nowPct, showNow])

  return (
    <div ref={scrollRef} className="overflow-x-auto">
      <div style={{ minWidth: MIN_TRACK + 112 }}>
        {/* Eixo das horas */}
        <div className="flex h-7 items-end" aria-hidden="true">
          <div className={cn('shrink-0 sticky left-0 z-10 h-full bg-card', NAME_COL)} />
          <div className="relative flex-1 h-full">
            {ticks.map((h, i) => (
              <span
                key={h}
                className={cn(
                  'absolute bottom-1.5 text-[11px] text-muted-foreground',
                  // some quando o rótulo do "agora" cairia em cima
                  showNow && Math.abs(pct(h * 60) - pct(nowMin)) < 5 && 'invisible',
                  i === 0 ? 'translate-x-0' : i === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
                )}
                style={{ left: `${pct(h * 60)}%` }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
            {showNow && (
              <span
                className="absolute bottom-1.5 -translate-x-1/2 rounded-[3px] bg-card px-1 text-[11px] font-medium text-booked"
                style={{ left: `${pct(nowMin)}%` }}
              >
                {now}
              </span>
            )}
          </div>
        </div>

        <ul>
          {rooms.map((room) => {
            const daSala = todays.filter((r) => r.sala_id === room.id)
            return (
              <li key={room.id} className="flex h-9 items-center border-t border-rule">
                <div className={cn('shrink-0 sticky left-0 z-10 flex h-full items-center bg-card pr-3 text-sm', NAME_COL)}>
                  <span className="truncate">{room.nome}</span>
                </div>
                <div className="relative flex-1 h-full">
                  {/* Linhas das horas */}
                  {ticks.map((h) => (
                    <span
                      key={h}
                      aria-hidden="true"
                      className="absolute inset-y-0 w-px bg-rule"
                      style={{ left: `${pct(h * 60)}%` }}
                    />
                  ))}

                  {/* Linha do agora, atrás das barras */}
                  {showNow && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 w-px bg-booked"
                      style={{ left: `${pct(nowMin)}%` }}
                    />
                  )}

                  {daSala.map((r) => {
                    const s = toMinutes(r.horario_inicio)
                    const e = toMinutes(r.horario_fim)
                    const state = e <= nowMin ? 'past' : s <= nowMin ? 'now' : 'next'
                    const label = `${r.titulo} · ${formatTime(r.horario_inicio)}–${formatTime(r.horario_fim)} · ${r.participante_responsavel}`
                    return (
                      <div
                        key={r.id}
                        title={label}
                        aria-label={label}
                        className={cn(
                          'absolute top-[7px] h-[22px] overflow-hidden text-ellipsis rounded-[4px] px-1.5 text-xs leading-[22px] whitespace-nowrap',
                          state === 'now' && 'bg-booked text-white font-medium',
                          state === 'next' && 'bg-booked-soft border-l-[3px] border-booked text-foreground',
                          state === 'past' && 'bg-muted text-muted-foreground'
                        )}
                        style={{ left: `${pct(s)}%`, width: `max(4px, calc(${pct(e) - pct(s)}% - 2px))` }}
                      >
                        {e - s >= 60 ? r.titulo : null}
                      </div>
                    )
                  })}

                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// Legenda com as mesmas marcas das barras
export function TodayStripLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-3.5 rounded-[3px] bg-booked" />
        Agora
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-3.5 rounded-[3px] bg-booked-soft border-l-[3px] border-booked" />
        Mais tarde
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-3.5 rounded-[3px] bg-muted" />
        Encerrada
      </span>
    </div>
  )
}
