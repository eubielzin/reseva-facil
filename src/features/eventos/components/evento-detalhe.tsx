'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, CalendarDays, Clock, Lock, MailCheck, MapPin, Tag } from 'lucide-react'
import { ErrorState } from '@/components/error-state'
import { formatTime } from '@/lib/utils'
import { useEvento } from '@/hooks/use-eventos'
import { EventoCapa } from './evento-capa'
import { VagasBadge } from './vagas-badge'
import { IngressoCard } from './ingresso-card'
import { PegarIngressoForm } from './pegar-ingresso-form'

/** Página do evento: público pelo id, privado pelo código do convite. */
export function EventoDetalhe({ id, convite }: { id?: string; convite?: string }) {
  const { data: evento, isLoading, isError, error, refetch } = useEvento({ id, convite })

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/eventos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Eventos
      </Link>

      {isLoading && (
        <div className="space-y-6">
          <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-muted sm:aspect-[21/9]" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      )}
      {isError && <ErrorState message={error.message} onRetry={() => refetch()} />}

      {evento && (
        <div className="space-y-6">
          <EventoCapa
            id={evento.id}
            titulo={evento.titulo}
            data={evento.data}
            imagemUrl={evento.imagem_url}
            tamanho="destaque"
            className="rounded-xl border sm:aspect-[21/9]"
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="min-w-0 space-y-6">
              <header>
                <div className="flex flex-wrap items-center gap-2">
                  <VagasBadge evento={evento} />
                  {evento.visibilidade === 'privado' && (
                    <span className="inline-flex h-5 items-center gap-1 rounded-full bg-muted px-2 text-xs font-medium">
                      <Lock className="h-3 w-3" />
                      Evento privado
                    </span>
                  )}
                </div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{evento.titulo}</h1>
              </header>

              {evento.descricao && (
                <section>
                  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Sobre o evento</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{evento.descricao}</p>
                </section>
              )}

              {evento.tags.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-medium text-muted-foreground">Ingressos para</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {evento.tags.map((t) => (
                      <span key={t} className="inline-flex h-7 items-center gap-1 rounded-full border bg-card px-3 text-xs">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {evento.meu_ingresso && (
                <section className="space-y-3">
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <MailCheck className="h-4 w-4" />
                    Seu ingresso está garantido. Também enviamos o QR code para o seu email.
                  </p>
                  <IngressoCard ingresso={evento.meu_ingresso} evento={evento} />
                </section>
              )}
            </div>

            {/* Quando, onde e o ingresso: fica ao lado no computador e acompanha a rolagem */}
            <aside className="space-y-4 rounded-lg border bg-card p-4 sm:p-5 lg:sticky lg:top-4">
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="first-letter:uppercase">
                    {format(new Date(evento.data + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {formatTime(evento.horario_inicio)} às {formatTime(evento.horario_fim)}
                </li>
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {evento.sala_nome}
                </li>
              </ul>

              <div className="border-t pt-4">
                {evento.meu_ingresso ? (
                  <p className="text-sm text-muted-foreground">Você já tem ingresso. O QR code está nesta página.</p>
                ) : evento.encerrado ? (
                  <p className="text-sm text-muted-foreground">Este evento já começou. Os ingressos estão encerrados.</p>
                ) : evento.esgotado ? (
                  <p className="text-sm text-muted-foreground">Os ingressos esgotaram.</p>
                ) : (
                  <PegarIngressoForm evento={evento} convite={convite} />
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}
