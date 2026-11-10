'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { CalendarCheck } from 'lucide-react'

/** Destino de quem entra ou se cadastra pelo link de organizador: a API promove usuário → organizador (admin não muda). */
export const DESTINO_ORGANIZADOR = '/bem-vindo?papel=organizador'

export function CabecalhoOrganizador({ descricao }: { descricao: string }) {
  return (
    <div className="max-w-sm text-center">
      <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted">
        <CalendarCheck className="h-4 w-4" />
      </div>
      <h1 className="text-lg font-semibold tracking-tight">Cadastro de organizador</h1>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
    </div>
  )
}

/** Quem já está logado e abre o link de organizador vai direto para a promoção, sem novo login. */
export function SeJaLogadoViraOrganizador() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace(DESTINO_ORGANIZADOR)
  }, [isLoaded, isSignedIn, router])
  return null
}
