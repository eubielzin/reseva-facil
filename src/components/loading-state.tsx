import { Skeleton } from '@/components/ui/skeleton'

// Esqueletos no tamanho real do conteúdo final, sem deslocar o layout quando os dados chegam
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex h-10 items-center gap-4 px-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-3 flex-1 max-w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-11 items-center gap-4 border-t border-rule px-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className ?? 'rounded-lg border bg-card p-5 space-y-3'}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-16" />
    </div>
  )
}
