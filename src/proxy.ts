import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { redirecionamentoDoPapel } from '@/lib/papeis'
import type { Papel } from '@/types'

const isPublicRoute = createRouteMatcher(['/entrar(.*)', '/cadastro(.*)'])

function papelDoToken(sessionClaims: Record<string, unknown> | null | undefined): Papel {
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  return role === 'admin' || role === 'organizador' ? role : 'usuario'
}

// Login obrigatório fora de /entrar e /cadastro; cada papel só abre as telas da sua área.
export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return
  await auth.protect()

  const { sessionClaims } = await auth()
  const destino = redirecionamentoDoPapel(papelDoToken(sessionClaims), req.nextUrl.pathname)
  if (destino) return NextResponse.redirect(new URL(destino, req.url))
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
