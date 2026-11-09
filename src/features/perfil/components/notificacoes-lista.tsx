'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { cn } from '@/lib/utils'
import { useContagemNaoLidas, useMarcarTodasLidas, useNotificacoes } from '@/hooks/use-perfil'
import { NotificacaoItem } from '@/features/notificacoes/components/notificacao-item'

export function NotificacoesLista() {
  const [soNaoLidas, setSoNaoLidas] = useState(false)
  const { data: notificacoes, isLoading, isError, refetch } = useNotificacoes(soNaoLidas, 100)
  const { data: naoLidas = 0 } = useContagemNaoLidas()
  const marcarTodas = useMarcarTodasLidas()

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-base font-semibold">Notificações</h2>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Filtro" className="flex h-8 items-center gap-0.5 rounded-md bg-muted p-0.5">
            {([
              { valor: false, label: 'Todas' },
              { valor: true, label: `Não lidas${naoLidas > 0 ? ` (${naoLidas})` : ''}` },
            ] as const).map(({ valor, label }) => (
              <button
                key={label}
                type="button"
                aria-pressed={soNaoLidas === valor}
                onClick={() => setSoNaoLidas(valor)}
                className={cn(
                  'h-7 rounded-[5px] px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                  soNaoLidas === valor ? 'bg-card text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" onClick={() => marcarTodas.mutate()} disabled={marcarTodas.isPending}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {isLoading && <TableSkeleton rows={3} cols={2} />}
      {isError && <ErrorState message="Não foi possível carregar as notificações." onRetry={() => refetch()} />}
      {notificacoes?.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          {soNaoLidas ? 'Você leu todas as notificações.' : 'Nenhuma notificação ainda.'}
        </p>
      )}
      {notificacoes && notificacoes.length > 0 && (
        <div className="rounded-lg border bg-card p-1">
          {notificacoes.map((n) => (
            <NotificacaoItem key={n.id} notificacao={n} />
          ))}
        </div>
      )}
    </section>
  )
}
