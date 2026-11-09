'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Ticket } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PageHeader } from '@/components/page-header'
import { CardSkeleton } from '@/components/loading-state'
import { usePerfil } from '@/hooks/use-perfil'
import { useRole } from '@/hooks/use-role'
import { PAPEL_LABEL } from '@/lib/papeis'
import { cn } from '@/lib/utils'
import { NotificacoesLista } from '@/features/perfil/components/notificacoes-lista'
import { EmailsFalhos } from '@/features/perfil/components/emails-falhos'

const PAPEL_CLASS = {
  usuario: 'bg-muted text-foreground',
  organizador: 'bg-booked-soft text-booked',
  admin: 'bg-foreground text-background',
} as const

export default function PerfilPage() {
  const { user } = useUser()
  const { papel, isAdmin, isLoaded } = useRole()
  const { data: perfil, isLoading } = usePerfil()

  // Clerk é a fonte do nome/email; o perfil da API traz o "membro desde"
  const nome = user?.fullName ?? perfil?.nome
  const email = user?.primaryEmailAddress?.emailAddress ?? perfil?.email

  return (
    <div className="space-y-10">
      <div>
        <PageHeader title="Perfil" />

        {!isLoaded || (isLoading && !user) ? (
          <CardSkeleton className="h-28 rounded-lg border bg-card p-5 space-y-3" />
        ) : (
          <div className="rounded-lg border bg-card px-5 py-4">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Nome</dt>
                <dd className="text-sm font-medium truncate">{nome ?? '—'}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium truncate">{email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Papel</dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex h-5 items-center rounded-full px-2 text-xs font-medium',
                      PAPEL_CLASS[papel]
                    )}
                  >
                    {PAPEL_LABEL[papel]}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Membro desde</dt>
                <dd className="text-sm font-medium">
                  {perfil?.created_at
                    ? format(new Date(perfil.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {isLoaded && papel === 'usuario' && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed bg-card/60 px-5 py-4">
            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Em breve: eventos e ingressos</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Aqui você vai encontrar os eventos abertos da instituição e os seus ingressos com QR code.
              </p>
            </div>
          </div>
        )}
      </div>

      <NotificacoesLista />

      {isAdmin && <EmailsFalhos />}
    </div>
  )
}
