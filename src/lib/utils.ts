import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ReservationStatus, ReservationWithRoom } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function getReservationStatus(reservation: ReservationWithRoom): ReservationStatus {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const currentTime = format(now, 'HH:mm')

  const { data, horario_inicio, horario_fim } = reservation

  if (data < today) return 'encerrada'
  if (data > today) return 'proxima'

  if (currentTime >= horario_inicio && currentTime < horario_fim) return 'em_andamento'
  if (currentTime >= horario_fim) return 'encerrada'
  return 'proxima'
}

export function statusLabel(status: ReservationStatus): string {
  const labels: Record<ReservationStatus, string> = {
    em_andamento: 'Em andamento',
    proxima: 'Próxima',
    encerrada: 'Encerrada',
  }
  return labels[status]
}
