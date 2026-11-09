// Cliente HTTP para a API Java (reseva-api). Toda chamada leva o JWT da
// sessão do Clerk em Authorization: Bearer — é o que o Spring valida.

type TokenGetter = () => Promise<string | null>

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

let getToken: TokenGetter = async () => null

// Registrado pelo <ApiAuthBridge /> com o getToken() do useAuth() do Clerk.
export function setTokenGetter(fn: TokenGetter) {
  getToken = fn
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${API_URL}${path}`, { ...init, headers })
}
