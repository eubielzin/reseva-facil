'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton } from '@/components/loading-state'
import { buttonVariants } from '@/components/ui/button'
import { IngressoCard } from '@/features/eventos/components/ingresso-card'
import { useMeusIngressos } from '@/hooks/use-eventos'
import { cn } from '@/lib/utils'

type Aba = 'proximos' | 'anteriores'

export default function IngressosPage() {
  const [aba, setAba] = useState<Aba>('proximos')
  const { data: ingressos, isLoading, isError, refetch } = useMeusIngressos()

  const { proximos, anteriores } = useMemo(() => {
    const lista = ingressos ?? []
    // Próximos: ativos de eventos que ainda não começaram, na ordem da data
    const proximos = lista.filter((i) => i.status === 'ativo' && !i.evento?.encerrado)
    const anteriores = lista
      .filter((i) => !proximos.includes(i))
      .sort((a, b) => (b.evento?.data ?? '').localeCompare(a.evento?.data ?? ''))
    return { proximos, anteriores }
  }, [ingressos])

  const visiveis = aba === 'proximos' ? proximos : anteriores

  return (
    <div className="max-w-3xl">
      <PageHeader title="Meus ingressos" description="Apresente o QR code na entrada do evento." />

      <div role="tablist" aria-label="Período" className="mb-5 inline-flex h-9 items-center gap-0.5 rounded-md bg-muted p-0.5">
        {([
          { valor: 'proximos', label: 'Próximos', total: proximos.length },
          { valor: 'anteriores', label: 'Anteriores e cancelados', total: anteriores.length },
        ] as const).map(({ valor, label, total }) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            onClick={() => setAba(valor)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              aba === valor ? 'bg-card text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {total > 0 && <span className="text-xs text-muted-foreground">{total}</span>}
          </button>
        ))}
      </div>

      {isLoading && <CardSkeleton className="h-48 rounded-lg border bg-card p-5 space-y-3" />}
      {isError && <ErrorState message="Não foi possível carregar seus ingressos." onRetry={() => refetch()} />}
      {ingressos && visiveis.length === 0 && (
        <EmptyState
          title={aba === 'proximos' ? 'Nenhum ingresso para os próximos eventos' : 'Nada por aqui'}
          description={aba === 'proximos' ? 'Veja os eventos abertos e garanta o seu lugar.' : undefined}
          action={
            aba === 'proximos' ? (
              <Link href="/eventos" className={buttonVariants({ size: 'lg' })}>
                Ver eventos
              </Link>
            ) : undefined
          }
        />
      )}
      <div className="space-y-3">
        {visiveis.map((i) => (
          <IngressoCard key={i.id} ingresso={i} />
        ))}
      </div>
    </div>
  )
}
