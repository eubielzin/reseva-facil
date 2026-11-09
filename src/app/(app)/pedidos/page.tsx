'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { PedidoLinha } from '@/features/pedidos/components/pedido-linha'
import { useReservations } from '@/hooks/use-reservations'
import { agruparDisputas } from '@/lib/business-rules'
import { cn, formatDate, formatTime } from '@/lib/utils'
import type { ReservationWithRoom } from '@/types'

type Aba = 'pedidos' | 'cancelamentos'

export default function PedidosPage() {
  return (
    <Suspense>
      <Pedidos />
    </Suspense>
  )
}

function intervaloDoGrupo(grupo: ReservationWithRoom[]) {
  const inicio = grupo.reduce((m, r) => (r.horario_inicio < m ? r.horario_inicio : m), grupo[0].horario_inicio)
  const fim = grupo.reduce((m, r) => (r.horario_fim > m ? r.horario_fim : m), grupo[0].horario_fim)
  return `${formatTime(inicio)}–${formatTime(fim)}`
}

// Fila de decisão do admin. Pedidos que disputam o mesmo horário ficam juntos, em ordem de chegada.
function Pedidos() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const aba: Aba = params.get('aba') === 'cancelamentos' ? 'cancelamentos' : 'pedidos'
  const destaqueId = params.get('destaque') ?? undefined

  const pendentes = useReservations(undefined, 'pendente')
  const cancelamentos = useReservations(undefined, 'cancelamento_solicitado')
  const atual = aba === 'pedidos' ? pendentes : cancelamentos

  const grupos = useMemo(() => agruparDisputas(pendentes.data ?? []), [pendentes.data])
  const listaCancelamentos = useMemo(
    () =>
      [...(cancelamentos.data ?? [])].sort((a, b) =>
        (a.cancelamento_solicitado_em ?? '').localeCompare(b.cancelamento_solicitado_em ?? '')
      ),
    [cancelamentos.data]
  )

  useEffect(() => {
    if (!destaqueId || atual.isLoading) return
    document.getElementById(`reserva-${destaqueId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [destaqueId, atual.isLoading])

  function trocarAba(nova: Aba) {
    router.replace(nova === 'pedidos' ? pathname : `${pathname}?aba=${nova}`)
  }

  const totalPedidos = pendentes.data?.length ?? 0
  const totalCancelamentos = cancelamentos.data?.length ?? 0

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Reservas de organizadores aguardando a sua decisão. Cada resposta é enviada por email."
      />

      <div role="tablist" aria-label="Tipo de pedido" className="mb-5 inline-flex h-9 items-center gap-0.5 rounded-md bg-muted p-0.5">
        {([
          { valor: 'pedidos', label: 'Reservas', total: totalPedidos },
          { valor: 'cancelamentos', label: 'Cancelamentos', total: totalCancelamentos },
        ] as const).map(({ valor, label, total }) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            onClick={() => trocarAba(valor)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              aba === valor ? 'bg-card text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {total > 0 && (
              <span className="rounded-full bg-pill-warning px-1.5 text-xs font-medium text-warning">{total}</span>
            )}
          </button>
        ))}
      </div>

      {atual.isLoading && <TableSkeleton rows={4} cols={3} />}
      {atual.isError && <ErrorState message="Não foi possível carregar os pedidos." onRetry={() => atual.refetch()} />}

      {aba === 'pedidos' && pendentes.data && (
        grupos.length === 0 ? (
          <EmptyState title="Nenhum pedido pendente" description="Quando um organizador pedir uma sala, o pedido aparece aqui." />
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => {
              const r0 = grupo[0]
              const disputa = grupo.length > 1
              return (
                <section key={r0.id} className="rounded-lg border bg-card">
                  {disputa && (
                    <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
                      <p className="text-sm font-medium">
                        {r0.sala.nome} · {formatDate(r0.data)} · {intervaloDoGrupo(grupo)}
                      </p>
                      <span className="rounded-full bg-pill-warning px-2 py-0.5 text-xs font-medium text-warning">
                        {grupo.length} pedidos disputando
                      </span>
                    </header>
                  )}
                  <ul className="divide-y">
                    {grupo.map((r, i) => (
                      <PedidoLinha
                        key={r.id}
                        reserva={r}
                        ordem={disputa ? i + 1 : undefined}
                        outros={r.concorrentes ?? grupo.length - 1}
                        modo="pedido"
                        destaque={r.id === destaqueId}
                        mostrarQuando={!disputa}
                      />
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )
      )}

      {aba === 'cancelamentos' && cancelamentos.data && (
        listaCancelamentos.length === 0 ? (
          <EmptyState title="Nenhum cancelamento solicitado" description="Organizadores pedem aqui o cancelamento de reservas já aprovadas." />
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {listaCancelamentos.map((r) => (
              <PedidoLinha
                key={r.id}
                reserva={r}
                outros={0}
                modo="cancelamento"
                destaque={r.id === destaqueId}
                mostrarQuando
              />
            ))}
          </ul>
        )
      )}
    </div>
  )
}
