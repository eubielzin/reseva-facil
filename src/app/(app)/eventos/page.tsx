'use client'

import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { EventoCard, EventoCardSkeleton } from '@/features/eventos/components/evento-card'
import { useVitrine } from '@/hooks/use-eventos'

// Vitrine: eventos públicos e aprovados que ainda não começaram
export default function EventosPage() {
  const { data: eventos, isLoading, isError, refetch } = useVitrine()

  return (
    <div>
      <PageHeader title="Eventos" description="Eventos abertos da instituição. Escolha um para pegar o seu ingresso." />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <EventoCardSkeleton key={i} />
          ))}
        </div>
      )}
      {isError && <ErrorState message="Não foi possível carregar os eventos." onRetry={() => refetch()} />}
      {eventos?.length === 0 && (
        <EmptyState
          title="Nenhum evento aberto no momento"
          description="Quando um evento público for aprovado, ele aparece aqui."
        />
      )}
      {eventos && eventos.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {eventos.map((e) => (
            <EventoCard key={e.id} evento={e} />
          ))}
        </div>
      )}
    </div>
  )
}
