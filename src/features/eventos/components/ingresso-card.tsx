'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ban, MapPin, ScanLine } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { cn, formatDate, formatTime } from '@/lib/utils'
import { qrSrc } from '@/services/eventos'
import { EventoCapa } from './evento-capa'
import { eventoTerminou } from '@/lib/business-rules'
import { useCancelarIngresso } from '@/hooks/use-eventos'
import type { EventoPublico, Ingresso } from '@/types'

const quando = (iso: string) => format(new Date(iso), "dd/MM 'às' HH:mm", { locale: ptBR })

/** Ingresso com QR grande. evento pode vir do próprio ingresso ou da página do evento. */
export function IngressoCard({ ingresso, evento }: { ingresso: Ingresso; evento?: EventoPublico }) {
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const cancelar = useCancelarIngresso()
  const ev = evento ?? ingresso.evento
  const ativo = ingresso.status === 'ativo'
  // "encerrado" da API quer dizer que já começou; o leitor vale até o fim
  const leitorAberto =
    ativo && ingresso.colaborador && !!ev &&
    !eventoTerminou(ev.data, ev.horario_fim, format(new Date(), "yyyy-MM-dd'T'HH:mm"))

  return (
    <article className={cn('overflow-hidden rounded-lg border bg-card', !ativo && 'opacity-70')}>
      {/* Em "Meus ingressos" a capa ajuda a reconhecer o evento; na página do evento ela já está no topo */}
      {!evento && ev?.imagem_url && (
        <EventoCapa id={ev.id} titulo={ev.titulo} data={ev.data} imagemUrl={ev.imagem_url} className="aspect-auto h-24" />
      )}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        {ativo ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem gerada pela API, sem otimização do Next
          <img
            src={qrSrc(ingresso)}
            alt={`QR code do ingresso ${ingresso.codigo}`}
            width={176}
            height={176}
            className="mx-auto h-44 w-44 shrink-0 rounded-md border bg-white p-1 sm:mx-0"
          />
        ) : (
          <div className="mx-auto flex h-44 w-44 shrink-0 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground sm:mx-0">
            Cancelado
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {ev && (
            <div>
              <Link href={`/eventos/${ev.id}`} className="font-medium hover:underline underline-offset-2">
                {ev.titulo}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDate(ev.data)} · {formatTime(ev.horario_inicio)}–{formatTime(ev.horario_fim)}
              </p>
              <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {ev.sala_nome}
              </p>
            </div>
          )}
          <p className="font-mono text-lg tracking-wider">{ingresso.codigo}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-foreground px-2.5 text-xs font-medium text-background">
              {ingresso.tag}
            </span>
            <span className="text-xs text-muted-foreground">
              {ativo
                ? `Pego em ${quando(ingresso.emitido_em)}`
                : `Cancelado em ${quando(ingresso.cancelado_em ?? ingresso.emitido_em)}`}
            </span>
          </div>
          {leitorAberto && ev && (
            // O dono do evento liberou o leitor para esta pessoa
            <Link href={`/eventos/${ev.id}/checkin`} className={cn(buttonVariants({ size: 'sm' }), 'mr-1')}>
              <ScanLine className="h-4 w-4" />
              Abrir leitor de QR
            </Link>
          )}
          {ingresso.pode_cancelar && (
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => setCancelarOpen(true)}>
              <Ban className="h-4 w-4" />
              Cancelar ingresso
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelarOpen}
        onOpenChange={setCancelarOpen}
        title="Cancelar ingresso"
        description="A vaga volta a ficar disponível. Para trocar de tag, cancele e pegue um ingresso novo."
        onConfirm={() => cancelar.mutate(ingresso.id, { onSuccess: () => setCancelarOpen(false) })}
        loading={cancelar.isPending}
        confirmLabel="Cancelar ingresso"
        loadingLabel="Cancelando..."
      />
    </article>
  )
}
