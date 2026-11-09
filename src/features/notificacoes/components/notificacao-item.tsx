'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { linkDaNotificacao } from '@/lib/notificacoes'
import { useMarcarNotificacaoLida } from '@/hooks/use-perfil'
import type { Notificacao } from '@/types'

interface NotificacaoItemProps {
  notificacao: Notificacao
  onNavigate?: () => void
  compacto?: boolean
}

// Não lida: ponto azul e título em peso médio. Clicar marca como lida e abre a tela do aviso.
export function NotificacaoItem({ notificacao: n, onNavigate, compacto }: NotificacaoItemProps) {
  const marcarLida = useMarcarNotificacaoLida()
  const naoLida = !n.lida_em

  return (
    <Link
      href={linkDaNotificacao(n)}
      onClick={() => {
        if (naoLida) marcarLida.mutate(n.id)
        onNavigate?.()
      }}
      className={cn(
        'flex gap-3 rounded-md px-3 transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        compacto ? 'py-2' : 'py-3'
      )}
    >
      <span
        aria-hidden
        className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', naoLida ? 'bg-booked' : 'bg-transparent')}
      />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm leading-snug', naoLida ? 'font-medium' : 'text-muted-foreground')}>
          {n.titulo}
          {naoLida && <span className="sr-only"> (não lida)</span>}
        </span>
        {n.mensagem && (
          <span className={cn('block text-xs text-muted-foreground mt-0.5', compacto && 'truncate')}>
            {n.mensagem}
          </span>
        )}
        <span className="block text-[11px] text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
        </span>
      </span>
    </Link>
  )
}
