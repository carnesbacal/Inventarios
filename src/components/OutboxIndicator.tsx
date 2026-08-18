// Indicador global de la cola offline: muestra pendientes por enviar y errores.
import { useEffect, useState } from 'react'
import { clearFailed, flush, getOutbox, retryFailed, subscribe } from '../lib/outbox'
import { Button, Sheet } from './ui'

export function OutboxIndicator() {
  const [pending, setPending] = useState(0)
  const [failed, setFailed] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => subscribe(({ pending, failed }) => {
    setPending(pending)
    setFailed(failed)
  }), [])

  if (pending === 0 && failed === 0) return null

  const failedOps = getOutbox().filter((o) => o.error)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
          failed > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
        }`}
      >
        {failed > 0 ? `⚠ ${failed} con error` : `⏳ ${pending} por enviar`}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Cola de envio">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Pendientes por enviar: <span className="font-bold text-slate-900">{pending}</span>
            {failed > 0 && (
              <>
                {' '}· Con error: <span className="font-bold text-red-600">{failed}</span>
              </>
            )}
          </p>

          {failedOps.length > 0 && (
            <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 text-sm">
              {failedOps.map((o) => (
                <li key={o.id} className="px-3 py-2">
                  <p className="text-slate-800">{o.label}</p>
                  <p className="text-xs text-red-600">{o.error}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                void flush()
                retryFailed()
              }}
              className="flex-1"
            >
              Reintentar
            </Button>
            {failed > 0 && (
              <Button variant="danger" onClick={() => clearFailed()} className="flex-1">
                Descartar con error
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-slate-500">
            Los pendientes se envian solos al recuperar la conexion.
          </p>
        </div>
      </Sheet>
    </>
  )
}
