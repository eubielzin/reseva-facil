import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

/** Bloco de data em destaque (dia grande, mês e dia da semana abreviados). */
export function DataBloco({ data, className }: { data: string; className?: string }) {
  const d = new Date(data + 'T12:00:00')
  return (
    <div
      className={cn(
        'flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border bg-card py-1.5 leading-none',
        className
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-booked">
        {format(d, 'MMM', { locale: ptBR }).replace('.', '')}
      </span>
      <span className="mt-1 text-2xl font-semibold tracking-tight">{format(d, 'd')}</span>
      <span className="mt-1 text-[11px] text-muted-foreground">{format(d, 'EEE', { locale: ptBR }).replace('.', '')}</span>
    </div>
  )
}
