import type { EmailRegistro, Notificacao, Perfil } from '@/types'
import { apiFetch } from '@/lib/api-client'

async function erro(res: Response, padrao: string): Promise<Error> {
  const data: unknown = await res.json().catch(() => null)
  const msg = data && typeof data === 'object' && 'error' in data ? String(data.error) : padrao
  return new Error(msg)
}

/**
 * Atualiza o espelho do usuário na API. papelDesejado só é usado no cadastro
 * pelo link /cadastro/organizador.
 */
export async function sincronizarPerfil(papelDesejado?: 'organizador'): Promise<Perfil> {
  const res = await apiFetch('/me', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(papelDesejado ? { papel_desejado: papelDesejado } : {}),
  })
  if (!res.ok) throw await erro(res, 'Não foi possível carregar o seu perfil.')
  return res.json()
}

export async function fetchPerfil(): Promise<Perfil> {
  const res = await apiFetch('/me')
  if (!res.ok) throw await erro(res, 'Não foi possível carregar o seu perfil.')
  return res.json()
}

export async function fetchNotificacoes(naoLidas = false, limite = 50): Promise<Notificacao[]> {
  const params = new URLSearchParams({ nao_lidas: String(naoLidas), limite: String(limite) })
  const res = await apiFetch(`/notificacoes?${params}`)
  if (!res.ok) throw await erro(res, 'Erro ao buscar notificações.')
  return res.json()
}

export async function fetchContagemNaoLidas(): Promise<number> {
  const res = await apiFetch('/notificacoes/nao-lidas/contagem')
  if (!res.ok) throw await erro(res, 'Erro ao buscar notificações.')
  const data: { total: number } = await res.json()
  return data.total
}

export async function marcarNotificacaoLida(id: string): Promise<Notificacao> {
  const res = await apiFetch(`/notificacoes/${id}/lida`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Erro ao marcar notificação como lida.')
  return res.json()
}

export async function marcarTodasLidas(): Promise<void> {
  const res = await apiFetch('/notificacoes/lidas', { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Erro ao marcar notificações como lidas.')
}

// Só admin
export async function fetchEmailsFalhos(): Promise<EmailRegistro[]> {
  const res = await apiFetch('/emails?status=falhou')
  if (!res.ok) throw await erro(res, 'Erro ao buscar emails com falha.')
  return res.json()
}

export async function reenviarEmail(id: string): Promise<EmailRegistro> {
  const res = await apiFetch(`/emails/${id}/reenviar`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Erro ao reenviar o email.')
  return res.json()
}
