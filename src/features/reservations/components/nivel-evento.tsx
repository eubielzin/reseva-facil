import { cn } from '@/lib/utils'
import type { Reservation } from '@/types'

type Nivel = NonNullable<Reservation['nivel_evento']>

export const NIVEL_LABELS: Record<Nivel, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

// Vermelho só para o que pede atenção (alta); média em âmbar; baixa em cinza
const DOT_CLASS: Record<Nivel, string> = {
  baixa: 'bg-[#8a8a8a]',
  media: 'bg-warning',
  alta: 'bg-destructive',
}

const PILL_CLASS: Record<Nivel, string> = {
  baixa: 'bg-muted text-[#3d3d3d] dark:text-foreground',
  media: 'bg-pill-warning text-warning',
  alta: 'bg-pill-negative text-pill-negative-ink',
}

export function NivelDot({ nivel, className }: { nivel: Nivel; className?: string }) {
  return (
    <span
      title={`Nível ${NIVEL_LABELS[nivel].toLowerCase()}`}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT_CLASS[nivel], className)}
    />
  )
}

export function NivelPill({ nivel }: { nivel: Nivel }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 flex-none items-center whitespace-nowrap rounded-full px-2 text-xs font-medium',
        PILL_CLASS[nivel]
      )}
    >
      Nível {NIVEL_LABELS[nivel].toLowerCase()}
    </span>
  )
}

// Legenda com as próprias marcas, só com os níveis presentes na lista
export function NivelLegend({ niveis }: { niveis: Nivel[] }) {
  const presentes = (['alta', 'media', 'baixa'] as const).filter((n) => niveis.includes(n))
  if (presentes.length === 0) return null
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>Nível do evento</span>
      {presentes.map((n) => (
        <span key={n} className="inline-flex items-center gap-1.5">
          <NivelDot nivel={n} />
          {NIVEL_LABELS[n]}
        </span>
      ))}
    </p>
  )
}
