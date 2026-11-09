import { cn } from '@/lib/utils'

export interface TodayFigure {
  label: string
  value: number
  unit?: string // sufixo cinza: "de 8 salas"
  note?: string
}

// Um só cartão dividido por linhas finas; o primeiro número responde à pergunta da tela e é o maior
export function TodayFigures({ figures }: { figures: TodayFigure[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 rounded-lg border bg-card">
      {figures.map((f, i) => (
        <div
          key={f.label}
          className={cn(
            'px-5 py-4',
            i % 2 === 1 && 'border-l',
            i >= 2 && 'border-t lg:border-t-0',
            i === 2 && 'lg:border-l'
          )}
        >
          <p className="text-sm text-muted-foreground">{f.label}</p>
          <p className="mt-1.5 leading-none">
            <span className={cn(i === 0 ? 'text-[30px] font-medium' : 'text-[22px]', 'tracking-tight')}>
              {f.value}
            </span>
            {f.unit && <span className="text-sm text-muted-foreground"> {f.unit}</span>}
          </p>
          {f.note && <p className="mt-2 text-xs text-muted-foreground">{f.note}</p>}
        </div>
      ))}
    </div>
  )
}
