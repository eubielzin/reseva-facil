import type { EventoPublico, EventoResumo, Ingresso } from '@/types'
import type { EventoFormValues } from '@/schemas/evento'
import { API_URL, apiFetch } from '@/lib/api-client'

async function erro(res: Response, padrao: string): Promise<Error> {
  const data: unknown = await res.json().catch(() => null)
  const msg = data && typeof data === 'object' && 'error' in data ? String(data.error) : padrao
  return new Error(msg)
}

/** URL da capa para o <img>: relativa vem da API (pasta); absoluta já vem pronta (MinIO). */
export function imagemSrc(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${API_URL}${url}`
}

/** Sobe a capa do evento; o formulário guarda a chave e a envia em evento.imagem. */
export async function enviarImagem(arquivo: File): Promise<{ chave: string; url: string }> {
  const corpo = new FormData()
  corpo.append('arquivo', arquivo)
  const res = await apiFetch('/imagens', { method: 'POST', body: corpo })
  if (!res.ok) throw await erro(res, 'Não foi possível enviar a imagem.')
  return res.json()
}

/** URL absoluta da imagem do QR (pública, sem login — usada também nos emails). */
export function qrSrc(ingresso: Pick<Ingresso, 'qr_url'>): string {
  return `${API_URL}${ingresso.qr_url}`
}

/** Link do convite de evento privado, para o organizador copiar. */
export function linkConvite(codigo: string): string {
  return `${window.location.origin}/eventos/convite/${codigo}`
}

export async function fetchVitrine(): Promise<EventoPublico[]> {
  const res = await apiFetch('/eventos')
  if (!res.ok) throw await erro(res, 'Erro ao buscar eventos.')
  return res.json()
}

export async function fetchEvento(id: string): Promise<EventoPublico> {
  const res = await apiFetch(`/eventos/${id}`)
  if (!res.ok) throw await erro(res, 'Evento não encontrado.')
  return res.json()
}

export async function fetchEventoPorConvite(codigo: string): Promise<EventoPublico> {
  const res = await apiFetch(`/eventos/convite/${encodeURIComponent(codigo)}`)
  if (!res.ok) throw await erro(res, 'Convite inválido ou expirado.')
  return res.json()
}

export async function pegarIngresso(eventoId: string, tag: string, codigoConvite?: string): Promise<Ingresso> {
  const res = await apiFetch(`/eventos/${eventoId}/ingressos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, codigo_convite: codigoConvite ?? null }),
  })
  if (!res.ok) throw await erro(res, 'Não foi possível pegar o ingresso.')
  return res.json()
}

export async function fetchMeusIngressos(): Promise<Ingresso[]> {
  const res = await apiFetch('/ingressos/meus')
  if (!res.ok) throw await erro(res, 'Erro ao buscar seus ingressos.')
  return res.json()
}

export async function cancelarIngresso(id: string): Promise<Ingresso> {
  const res = await apiFetch(`/ingressos/${id}/cancelar`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Não foi possível cancelar o ingresso.')
  return res.json()
}

// Organizador/admin
export async function editarEvento(reservaId: string, values: EventoFormValues): Promise<EventoResumo> {
  const res = await apiFetch(`/reservas/${reservaId}/evento`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...values, descricao: values.descricao.trim() }),
  })
  if (!res.ok) throw await erro(res, 'Não foi possível salvar o evento.')
  return res.json()
}

export async function novoConvite(reservaId: string): Promise<EventoResumo> {
  const res = await apiFetch(`/reservas/${reservaId}/evento/convite`, { method: 'POST' })
  if (!res.ok) throw await erro(res, 'Não foi possível gerar um novo link.')
  return res.json()
}
