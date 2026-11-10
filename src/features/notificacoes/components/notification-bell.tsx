'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useContagemNaoLidas, useMarcarTodasLidas, useNotificacoes } from '@/hooks/use-perfil'
import { NotificacaoItem } from './notificacao-item'

// Sininho: contagem atualizada a cada 30 s; abre as 5 últimas notificações
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { data: total = 0 } = useContagemNaoLidas()
  const ultimas = useNotificacoes(false, 5)
  const marcarTodas = useMarcarTodasLidas()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={total > 0 ? `Notificações: ${total} não lidas` : 'Notificações'}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative h-8 w-8', className)}
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-medium">Notificações</p>
          {total > 0 && (
            <button
              type="button"
              onClick={() => marcarTodas.mutate()}
              disabled={marcarTodas.isPending}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-[60dvh] overflow-y-auto p-1">
          {ultimas.isLoading && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Carregando…</p>}
          {ultimas.isError && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Não foi possível carregar.</p>
          )}
          {ultimas.data?.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
          )}
          {ultimas.data?.map((n) => (
            <NotificacaoItem key={n.id} notificacao={n} compacto onNavigate={() => setOpen(false)} />
          ))}
        </div>
        <Link
          href="/perfil/notificacoes"
          onClick={() => setOpen(false)}
          className="block border-t px-3 py-2.5 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Ver todas
        </Link>
      </PopoverContent>
    </Popover>
  )
}
