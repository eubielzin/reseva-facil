import { cn } from '@/lib/utils'
import { situacaoVagas } from '@/lib/business-rules'
import type { EventoPublico } from '@/types'

/** "Você vai" > "Esgotado" > "Últimas vagas" > "N vagas". */
export function VagasBadge({ evento, className }: { evento: EventoPublico; className?: string }) {
  const base = 'inline-flex h-5 flex-none items-center whitespace-nowrap rounded-full px-2 text-xs font-medium'
  if (evento.meu_ingresso) {
    return <span className={cn(base, 'bg-booked-soft text-booked', className)}>Você vai</span>
  }
  const situacao = situacaoVagas(evento.vagas_restantes, evento.limite_ingressos)
  if (situacao === 'esgotado') {
    return <span className={cn(base, 'bg-muted text-muted-foreground', className)}>Esgotado</span>
  }
  if (situacao === 'ultimas') {
    return (
      <span className={cn(base, 'bg-pill-warning text-warning', className)}>
        {evento.vagas_restantes === 1 ? 'Última vaga' : `Últimas ${evento.vagas_restantes} vagas`}
      </span>
    )
  }
  return (
    <span className={cn(base, 'bg-muted text-foreground', className)}>
      {evento.vagas_restantes} vagas
    </span>
  )
}
