'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Lock, MapPin, MailCheck } from 'lucide-react'
import { ErrorState } from '@/components/error-state'
import { CardSkeleton } from '@/components/loading-state'
import { formatTime } from '@/lib/utils'
import { useEvento } from '@/hooks/use-eventos'
import { DataBloco } from './data-bloco'
import { VagasBadge } from './vagas-badge'
import { IngressoCard } from './ingresso-card'
import { PegarIngressoForm } from './pegar-ingresso-form'

/** Página do evento: público pelo id, privado pelo código do convite. */
export function EventoDetalhe({ id, convite }: { id?: string; convite?: string }) {
  const { data: evento, isLoading, isError, error, refetch } = useEvento({ id, convite })

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/eventos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Eventos
      </Link>

      {isLoading && <CardSkeleton className="h-48 rounded-lg border bg-card p-5 space-y-3" />}
      {isError && <ErrorState message={error.message} onRetry={() => refetch()} />}

      {evento && (
        <div className="space-y-6">
          <header className="flex gap-4">
            <DataBloco data={evento.data} />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{evento.titulo}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(evento.horario_inicio)}–{formatTime(evento.horario_fim)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {evento.sala_nome}
                </span>
                {evento.visibilidade === 'privado' && (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Evento privado
                  </span>
                )}
                <VagasBadge evento={evento} />
              </p>
            </div>
          </header>

          {evento.descricao && (
            <p className="whitespace-pre-line text-sm leading-relaxed">{evento.descricao}</p>
          )}

          <section className="rounded-lg border bg-muted/30 p-4 sm:p-5">
            {evento.meu_ingresso ? (
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MailCheck className="h-4 w-4" />
                  Seu ingresso está garantido. Também enviamos o QR code para o seu email.
                </p>
                <IngressoCard ingresso={evento.meu_ingresso} evento={evento} />
              </div>
            ) : evento.encerrado ? (
              <p className="text-sm text-muted-foreground">Este evento já começou. Os ingressos estão encerrados.</p>
            ) : evento.esgotado ? (
              <p className="text-sm text-muted-foreground">Os ingressos esgotaram.</p>
            ) : (
              <PegarIngressoForm evento={evento} convite={convite} />
            )}
          </section>
        </div>
      )}
    </div>
  )
}
