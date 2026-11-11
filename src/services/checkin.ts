import type { CheckinInfo, CheckinLeitura, PainelEvento, Participante } from '@/types'
import { apiFetch } from '@/lib/api-client'

async function erro(res: Response, padrao: string): Promise<Error> {
  const data: unknown = await res.json().catch(() => null)
  const msg = data && typeof data === 'object' && 'error' in data ? String(data.error) : padrao
  return new Error(msg)
}

/** Cabeçalho do leitor. Dono, admin ou colaborador; os outros recebem 404. */
export async function fetchCheckinInfo(eventoId: string): Promise<CheckinInfo> {
  const res = await apiFetch(`/eventos/${eventoId}/checkin`)
  if (!res.ok) {
    throw await erro(res, res.status === 404
      ? 'Você não é colaborador deste evento. Peça ao organizador para liberar o leitor.'
      : 'Não foi possível abrir o leitor.')
  }
  return res.json()
}

/** Sempre 200 com o resultado (ok, ja_entrou, cancelado...). */
export async function lerIngresso(eventoId: string, codigo: string): Promise<CheckinLeitura> {
  const res = await apiFetch(`/eventos/${eventoId}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
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

/** Dono ou admin libera (ou tira) o leitor de QR para quem tem ingresso. */
export async function definirColaborador(ingressoId: string, colaborador: boolean): Promise<Participante> {
  const res = await apiFetch(`/ingressos/${ingressoId}/colaborador`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colaborador }),
  })
  if (!res.ok) throw await erro(res, 'Não foi possível alterar o colaborador.')
  return res.json()
}
