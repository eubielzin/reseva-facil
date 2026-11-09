'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { ErrorState } from '@/components/error-state'
import { sincronizarPerfil } from '@/services/perfil'
import { homeDoPapel } from '@/lib/papeis'

/**
 * Destino de todo login/cadastro. Grava o usuário na API (e o papel de organizador,
 * se veio do link /cadastro/organizador), renova o token para o JWT já sair com o
 * papel novo e manda cada papel para a sua área.
 */
function BemVindo() {
  const router = useRouter()
  const params = useSearchParams()
  const { getToken, isLoaded: authLoaded } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()
  const [erro, setErro] = useState<string | null>(null)
  const iniciou = useRef(false)

  const sincronizar = useCallback(async () => {
    setErro(null)
    try {
      const desejado = params.get('papel') === 'organizador' ? 'organizador' : undefined
      const perfil = await sincronizarPerfil(desejado)
      // Token e user em cache ainda têm o papel antigo
      await getToken({ skipCache: true })
      await user?.reload()
      router.replace(homeDoPapel(perfil.papel))
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir o cadastro.')
    }
  }, [params, getToken, user, router])

  useEffect(() => {
    if (!authLoaded || !userLoaded || iniciou.current) return
    iniciou.current = true
    void sincronizar()
  }, [authLoaded, userLoaded, sincronizar])

  if (erro) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <ErrorState message={erro} onRetry={() => void sincronizar()} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Preparando sua conta…
    </div>
  )
}

export default function BemVindoPage() {
  return (
    <Suspense>
      <BemVindo />
    </Suspense>
  )
}
