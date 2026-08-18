// Cliente HTTP base. Envuelve fetch con manejo uniforme de errores y JSON.
import { API_BASE } from '../config'
import { clearSession, loadToken } from '../auth/session'

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type Query = Record<string, string | number | undefined | null>

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_BASE + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown } = {},
): Promise<T> {
  // Adjunta el token (Bearer) si existe. Si el backend aun no usa tokens, no estorba.
  const token = loadToken()

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch (e) {
    // Fallo de red (sin conexion, CORS, etc.)
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexion.', e)
  }

  const body = await parseBody(res)

  // Token vencido/invalido en una sesion activa: cerrar sesion y volver al login.
  if (res.status === 401 && localStorage.getItem('inv_session_user')) {
    clearSession()
    try {
      window.location.reload()
    } catch {
      /* ignore */
    }
  }

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && typeof (body as any).error === 'string'
        ? (body as any).error
        : undefined) ?? `Error ${res.status}`
    throw new ApiError(res.status, message, body)
  }

  return body as T
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
}
