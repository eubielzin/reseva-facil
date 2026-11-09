import type { Papel } from '@/types'

/** Primeira tela de cada papel depois do login. */
export function homeDoPapel(papel: Papel): string {
  if (papel === 'admin') return '/'
  if (papel === 'organizador') return '/reservas'
  return '/perfil'
}

/**
 * Para onde redirecionar quem abriu uma rota que o papel não pode ver, ou null se pode.
 * Só UX: quem bloqueia de verdade é a API (403).
 */
export function redirecionamentoDoPapel(papel: Papel, pathname: string): string | null {
  const livre = pathname.startsWith('/perfil') || pathname.startsWith('/bem-vindo')
  if (livre || papel === 'admin') return null
  if (papel === 'usuario') return '/perfil'
  // organizador
  if (pathname === '/' || pathname.startsWith('/pedidos')) return '/reservas'
  return null
}

export const PAPEL_LABEL: Record<Papel, string> = {
  usuario: 'Participante',
  organizador: 'Organizador',
  admin: 'Administrador',
}
