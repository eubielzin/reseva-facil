'use client'

import { useAuth } from '@clerk/nextjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { setTokenGetter } from '@/lib/api-client'

// Registra o getToken do Clerk no api-client durante o render — antes de
// qualquer query dos filhos disparar (queries rodam em efeitos, depois do render).
function ApiAuthBridge() {
  const { getToken } = useAuth()
  setTokenGetter(getToken)
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiAuthBridge />
      {children}
      <Toaster richColors position="top-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
