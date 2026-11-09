'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { queryClient, queryKeys } from '@/lib/query-client'
import { setTokenGetter } from '@/lib/api-client'
import { sincronizarPerfil } from '@/services/perfil'

// Registra o getToken do Clerk no api-client durante o render — antes de
// qualquer query dos filhos disparar (queries rodam em efeitos, depois do render).
function ApiAuthBridge() {
  const { getToken } = useAuth()
  setTokenGetter(getToken)
  return null
}

// Uma vez por sessão, atualiza o espelho do usuário na API (nome, email, papel).
// É o que coloca admins promovidos no Clerk na lista de quem recebe os avisos.
// /bem-vindo faz a própria sincronização (com o papel pedido no cadastro).
function PerfilSync() {
  const { isSignedIn, userId } = useAuth()
  const pathname = usePathname()
  const sincronizado = useRef<string | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId || pathname.startsWith('/bem-vindo')) return
    if (sincronizado.current === userId) return
    sincronizado.current = userId
    sincronizarPerfil()
      .then((perfil) => queryClient.setQueryData(queryKeys.perfil, perfil))
      .catch(() => {
        // Sem a API no ar o app continua; tenta de novo no próximo carregamento
        sincronizado.current = null
      })
  }, [isSignedIn, userId, pathname])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiAuthBridge />
      <PerfilSync />
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
