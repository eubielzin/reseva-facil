'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserProfile } from '@clerk/nextjs'
import { Bell, MailWarning } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
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

// Perfil único: a tela de conta do Clerk (dados, email, senha, sessões) com as abas do sistema
// (notificações e, para o admin, emails com falha). O "Gerenciar conta" do menu também abre aqui.
export default function PerfilPage() {
  const { papel, isAdmin, isLoaded } = useRole()
  const { data: perfil } = usePerfil()

  return (
    <div>
      <PageHeader title="Perfil" />

      {isLoaded && (
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span
            className={cn(
              'inline-flex h-5 items-center rounded-full px-2 text-xs font-medium',
              PAPEL_CLASS[papel]
            )}
          >
            {PAPEL_LABEL[papel]}
          </span>
          {perfil?.created_at && (
            <span>Membro desde {format(new Date(perfil.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          )}
        </p>
      )}

      <UserProfile
        path="/perfil"
        routing="path"
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full max-w-none shadow-none border rounded-lg',
          },
        }}
      >
        <UserProfile.Page label="account" />
        <UserProfile.Page label="Notificações" url="notificacoes" labelIcon={<Bell className="h-4 w-4" />}>
          <NotificacoesLista />
        </UserProfile.Page>
        {isAdmin && (
          <UserProfile.Page label="Emails com falha" url="emails" labelIcon={<MailWarning className="h-4 w-4" />}>
            <EmailsFalhos />
          </UserProfile.Page>
        )}
        <UserProfile.Page label="security" />
      </UserProfile>
    </div>
  )
}
