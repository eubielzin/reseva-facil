import { cn } from '@/lib/utils'

// Marca do ReservaFácil: a coluna de um dia com um horário reservado
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={cn('h-5 w-5 shrink-0', className)}>
      <rect x="2.75" y="1.75" width="14.5" height="16.5" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 6h14.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6" y="9" width="8" height="5.5" rx="1" fill="var(--booked)" />
    </svg>
  )
}

export function BrandName({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <div className="leading-tight">
        <p className="text-sm font-semibold">ReservaFácil</p>
        <p className="text-xs text-muted-foreground">Salas de reunião</p>
      </div>
    </div>
  )
}
