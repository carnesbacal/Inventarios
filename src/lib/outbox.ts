// Cola local (outbox) de conteos y traspasos pendientes de enviar.
// Estrategia: cada guardado se encola y se envia en segundo plano. Si falla la red,
// se reintenta al reconectar / por intervalo. Errores de validacion (4xx) se marcan
// como "con error" y NO se reintentan solos (requieren atencion del usuario).
import { ApiError } from '../api/client'
import { guardarInventario, guardarTraspaso } from '../api/endpoints'
import type { GuardarInventarioPayload, GuardarTraspasoPayload } from '../api/types'

export type OutboxOp =
  | {
      id: string
      kind: 'inventario'
      payload: GuardarInventarioPayload
      label: string
      createdAt: string
      tries: number
      error?: string
    }
  | {
      id: string
      kind: 'traspaso'
      payload: GuardarTraspasoPayload
      label: string
      createdAt: string
      tries: number
      error?: string
    }

const KEY = 'inv_outbox'

type Listener = (state: { pending: number; failed: number }) => void
const listeners = new Set<Listener>()

function genId(): string {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

function read(): OutboxOp[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as OutboxOp[]
  } catch {
    return []
  }
}

function write(ops: OutboxOp[]): void {
  localStorage.setItem(KEY, JSON.stringify(ops))
  notify()
}

function counts(ops = read()): { pending: number; failed: number } {
  const failed = ops.filter((o) => o.error).length
  return { pending: ops.length - failed, failed }
}

function notify(): void {
  const c = counts()
  listeners.forEach((l) => l(c))
}

export function subscribe(l: Listener): () => void {
  listeners.add(l)
  l(counts())
  return () => {
    listeners.delete(l)
  }
}

export function getOutbox(): OutboxOp[] {
  return read()
}

export function pendingCount(): number {
  return counts().pending
}

export function enqueue(op: {
  kind: OutboxOp['kind']
  payload: GuardarInventarioPayload | GuardarTraspasoPayload
  label: string
  createdAt: string
}): void {
  const ops = read()
  ops.push({ ...op, id: genId(), tries: 0 } as OutboxOp)
  write(ops)
  void flush()
}

let flushing = false

export async function flush(): Promise<void> {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const snapshot = read()
    for (const op of snapshot) {
      if (op.error) continue // fallo permanente: no reintentar automatico
      try {
        if (op.kind === 'inventario') await guardarInventario(op.payload)
        else await guardarTraspaso(op.payload)
        write(read().filter((o) => o.id !== op.id))
      } catch (e) {
        const isClientError = e instanceof ApiError && e.status >= 400 && e.status < 500
        write(
          read().map((o) =>
            o.id === op.id
              ? {
                  ...o,
                  tries: o.tries + 1,
                  error: isClientError ? (e instanceof ApiError ? e.message : 'Error') : undefined,
                }
              : o,
          ),
        )
        if (!isClientError) break // error de red: parar y reintentar despues
      }
    }
  } finally {
    flushing = false
  }
}

/** Reintenta los marcados con error (limpia su bandera de error). */
export function retryFailed(): void {
  write(read().map((o) => ({ ...o, error: undefined })))
  void flush()
}

/** Descarta los que quedaron con error de validacion. */
export function clearFailed(): void {
  write(read().filter((o) => !o.error))
}

let started = false

export function startOutbox(): void {
  if (started) return
  started = true
  window.addEventListener('online', () => void flush())
  window.setInterval(() => {
    if (navigator.onLine && read().some((o) => !o.error)) void flush()
  }, 20000)
  void flush()
}
