'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Check, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { RecusarDialog } from '@/features/reservations/components/recusar-dialog'
import { NivelDot } from '@/features/reservations/components/nivel-evento'
import { EventoSelo } from '@/features/eventos/components/evento-selo'
import { useMudarStatusReserva } from '@/hooks/use-reservations'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { ReservationWithRoom } from '@/types'

interface PedidoLinhaProps {
  reserva: ReservationWithRoom
  /** Posição na disputa (1 = chegou primeiro); omitido em pedido sem disputa */
  ordem?: number
  /** Quantos outros pedidos serão recusados se este for aprovado */
  outros: number
  /** Cancelamento: decide o pedido de cancelamento em vez do pedido de reserva */
  modo: 'pedido' | 'cancelamento'
  destaque?: boolean
  /** Mostra sala/data/horário na própria linha (pedidos fora de grupo) */
  mostrarQuando?: boolean
}

const quando = (iso: string) => format(new Date(iso), "dd/MM 'às' HH:mm", { locale: ptBR })

export function PedidoLinha({ reserva: r, ordem, outros, modo, destaque, mostrarQuando }: PedidoLinhaProps) {
  const mudarStatus = useMudarStatusReserva()
  const [aprovarOpen, setAprovarOpen] = useState(false)
  const [recusarOpen, setRecusarOpen] = useState(false)
  const [recusarCancelamentoOpen, setRecusarCancelamentoOpen] = useState(false)

  const aprovarAcao = modo === 'pedido' ? 'aprovar' : 'aprovar_cancelamento'

  return (
    <li
      id={`reserva-${r.id}`}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 scroll-mt-24',
        destaque && 'bg-booked-soft/60'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {ordem !== undefined && (
            <span
              className={cn(
                'inline-flex h-5 items-center rounded-full px-2 font-medium',
                ordem === 1 ? 'bg-foreground text-background' : 'bg-muted text-foreground'
              )}
            >
              {ordem}º pedido
            </span>
          )}
          <span>
            {modo === 'pedido'
              ? `Pedido em ${quando(r.created_at)}`
              : `Cancelamento pedido em ${quando(r.cancelamento_solicitado_em ?? r.updated_at)}`}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-medium">
          {r.nivel_evento && <NivelDot nivel={r.nivel_evento} />}
          <span className="truncate">{r.titulo}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {r.participante_responsavel}
          {r.nome_empresa ? ` · ${r.nome_empresa}` : ''} · {r.quantidade_participantes}/{r.sala.capacidade} pessoas
          {mostrarQuando &&
            ` · ${r.sala.nome}, ${formatDate(r.data)} ${formatTime(r.horario_inicio)}–${formatTime(r.horario_fim)}`}
        </p>
        {/* O admin vê o que vai para a vitrine antes de aprovar */}
        {r.evento && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <EventoSelo evento={r.evento} />
            <span>
              {r.evento.visibilidade === 'publico' ? 'Público, vai para a vitrine' : 'Privado, só por link'} · Tags:{' '}
              {r.evento.tags.join(', ')}
            </span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (modo === 'pedido' ? setRecusarOpen(true) : setRecusarCancelamentoOpen(true))}
        >
          {modo === 'pedido' ? <X className="h-4 w-4" /> : <Undo2 className="h-4 w-4" />}
          {modo === 'pedido' ? 'Recusar' : 'Manter reserva'}
        </Button>
        <Button size="sm" onClick={() => setAprovarOpen(true)}>
          <Check className="h-4 w-4" />
          {modo === 'pedido' ? 'Aprovar' : 'Cancelar reserva'}
        </Button>
      </div>

      <ConfirmDialog
        open={aprovarOpen}
        onOpenChange={setAprovarOpen}
        title={modo === 'pedido' ? 'Aprovar pedido' : 'Aprovar cancelamento'}
        description={
          modo === 'cancelamento'
            ? `"${r.titulo}" será cancelada e o horário liberado. O organizador será avisado.`
            : outros > 0
              ? `Os outros ${outros} ${outros === 1 ? 'pedido' : 'pedidos'} deste horário serão recusados automaticamente, e cada organizador será avisado.`
              : `Aprovar "${r.titulo}"? O organizador será avisado por email.`
        }
        onConfirm={() => mudarStatus.mutate({ id: r.id, acao: aprovarAcao }, { onSuccess: () => setAprovarOpen(false) })}
        loading={mudarStatus.isPending}
        confirmLabel={modo === 'pedido' ? 'Aprovar' : 'Cancelar reserva'}
        loadingLabel="Salvando..."
        variant={modo === 'pedido' ? 'default' : 'destructive'}
      />

      <ConfirmDialog
        open={recusarCancelamentoOpen}
        onOpenChange={setRecusarCancelamentoOpen}
        title="Recusar cancelamento"
        description={`"${r.titulo}" continua valendo. O organizador será avisado.`}
        onConfirm={() =>
          mudarStatus.mutate(
            { id: r.id, acao: 'recusar_cancelamento' },
            { onSuccess: () => setRecusarCancelamentoOpen(false) }
          )
        }
        loading={mudarStatus.isPending}
        confirmLabel="Manter reserva"
        loadingLabel="Salvando..."
        variant="default"
      />

      <RecusarDialog open={recusarOpen} onOpenChange={setRecusarOpen} reservaId={r.id} titulo={r.titulo} />
    </li>
  )
}
