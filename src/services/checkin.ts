import type { CheckinInfo, CheckinLeitura, EventoResumo, PainelEvento } from '@/types'
import { apiFetch } from '@/lib/api-client'

async function erro(res: Response, padrao: string): Promise<Error> {
  const data: unknown = await res.json().catch(() => null)
  const msg = data && typeof data === 'object' && 'error' in data ? String(data.error) : padrao
  return new Error(msg)
}

/** Link do leitor para a equipe de apoio. */
export function linkCheckin(codigo: string): string {
  return `${window.location.origin}/checkin/${codigo}`
}

export async function fetchCheckinInfo(codigoCheckin: string): Promise<CheckinInfo> {
  const res = await apiFetch(`/eventos/checkin/${encodeURIComponent(codigoCheckin)}`)
  if (!res.ok) throw await erro(res, 'Link de check-in inválido ou expirado.')
  return res.json()
}

/** Sempre 200 com o resultado (ok, ja_entrou, cancelado...). */
export async function lerIngresso(eventoId: string, codigo: string, codigoCheckin?: string): Promise<CheckinLeitura> {
  const res = await apiFetch(`/eventos/${eventoId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, codigo_checkin: codigoCheckin ?? null }),
  })
  if (!res.ok) throw await erro(res, 'Não foi possível registrar o check-in.')
  return res.json()
}

export async function fetchPainel(reservaId: string): Promise<PainelEvento> {
  const res = await apiFetch(`/reservas/${reservaId}/evento/participantes`)
  if (!res.ok) throw await erro(res, 'Não foi possível carregar o painel do evento.')
  return res.json()
}

export async function desfazerCheckin(ingressoId: string): Promise<void> {
  const res = await apiFetch(`/ingressos/${ingressoId}/checkin/desfazer`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Não foi possível desfazer o check-in.')
}

export async function novoLinkCheckin(reservaId: string): Promise<EventoResumo> {
  const res = await apiFetch(`/reservas/${reservaId}/evento/link-checkin`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Não foi possível gerar um novo link.')
  return res.json()
}
