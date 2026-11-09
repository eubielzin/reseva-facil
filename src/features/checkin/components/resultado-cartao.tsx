import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { corDoResultado } from '@/lib/business-rules'
import type { CheckinLeitura } from '@/types'

const ESTILO = {
  verde: 'bg-emerald-600 text-white',
  amarelo: 'bg-amber-400 text-amber-950',
  vermelho: 'bg-red-600 text-white',
} as const

const ICONE = { verde: CircleCheck, amarelo: CircleAlert, vermelho: CircleX } as const

/** Cartão grande da última leitura — legível de longe por quem está na porta. */
export function ResultadoCartao({ leitura }: { leitura: CheckinLeitura }) {
  const cor = corDoResultado(leitura.resultado)
  const Icone = ICONE[cor]
  const p = leitura.participante

  return (
    <div role="status" aria-live="assertive" className={cn('rounded-xl px-5 py-5 shadow-sm', ESTILO[cor])}>
      <div className="flex items-center gap-3">
        <Icone className="h-8 w-8 shrink-0" />
        <p className="text-2xl font-semibold tracking-tight">{leitura.mensagem}</p>
      </div>
      {p && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-xl font-medium">{p.nome ?? 'Participante'}</p>
          <span className="rounded-full bg-black/15 px-3 py-1 text-base font-semibold">{p.tag}</span>
          <span className="font-mono text-sm opacity-80">{p.codigo}</span>
        </div>
      )}
    </div>
  )
}
