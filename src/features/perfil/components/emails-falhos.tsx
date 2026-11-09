'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-state'
import { useEmailsFalhos, useReenviarEmail } from '@/hooks/use-perfil'

// Só admin: emails que o oxymail não entregou, com reenvio na hora
export function EmailsFalhos() {
  const { data: emails, isLoading, isError, refetch } = useEmailsFalhos(true)
  const reenviar = useReenviarEmail()

  return (
    <section id="emails" className="scroll-mt-20">
      <h2 className="text-base font-semibold">Emails com falha</h2>
      <p className="text-sm text-muted-foreground mt-0.5 mb-3">
        Avisos que o serviço de email não conseguiu entregar. Reenvie quando o serviço voltar.
      </p>

      {isLoading && <TableSkeleton rows={2} cols={3} />}
      {isError && <ErrorState message="Não foi possível carregar os emails." onRetry={() => refetch()} />}
      {emails?.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Nenhum email pendente. Tudo foi entregue.
        </p>
      )}

      {emails && emails.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card">
          {emails.map((e) => {
            const enviando = reenviar.isPending && reenviar.variables === e.id
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.assunto}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Para {e.destinatario} ·{' '}
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })} ·{' '}
                    {e.tentativas} {e.tentativas === 1 ? 'tentativa' : 'tentativas'}
                  </p>
                  {e.ultimo_erro && (
                    <p className="text-xs text-pill-negative-ink mt-0.5 truncate" title={e.ultimo_erro}>
                      {e.ultimo_erro}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => reenviar.mutate(e.id)} disabled={enviando}>
                  <RotateCw className={enviando ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                  {enviando ? 'Reenviando…' : 'Reenviar'}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
