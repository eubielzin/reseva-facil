'use client'

import { useUser } from '@clerk/nextjs'
import type { Papel } from '@/types'

type Metadata = { role?: string }

function toPapel(role: string | undefined): Papel {
  return role === 'admin' || role === 'organizador' ? role : 'usuario'
}

/** Papel do usuário (public_metadata.role do Clerk). Sem papel = usuário comum. */
export function useRole() {
  const { user, isLoaded } = useUser()
  const papel = toPapel((user?.publicMetadata as Metadata | undefined)?.role)
  return {
    papel,
    userId: user?.id,
    isAdmin: papel === 'admin',
    isOrganizador: papel === 'organizador',
    isLoaded,
  }
}
