import type { Papel } from '@/types'

/** Primeira tela de cada papel depois do login. */
export function homeDoPapel(papel: Papel): string {
  if (papel === 'admin') return '/'
  if (papel === 'organizador') return '/reservas'
  return '/eventos'
}

/** Telas de participante (qualquer papel pega ingresso) e o leitor de check-in, que vale pelo link. */
const AREA_COMUM = ['/perfil', '/bem-vindo', '/eventos', '/ingressos', '/checkin']

/**
 * Para onde redirecionar quem abriu uma rota que o papel não pode ver, ou null se pode.
 * Só UX: quem bloqueia de verdade é a API (403).
 */
export function redirecionamentoDoPapel(papel: Papel, pathname: string): string | null {
  const livre = AREA_COMUM.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`))
  if (livre || papel === 'admin') return null
  if (papel === 'usuario') return '/eventos'
  // organizador
  if (pathname === '/' || pathname.startsWith('/pedidos')) return '/reservas'
  return null
}

export const PAPEL_LABEL: Record<Papel, string> = {
  usuario: 'Participante',
  organizador: 'Organizador',
  admin: 'Administrador',
}
