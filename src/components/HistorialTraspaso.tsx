// Historial de traspasos (seccion 5.9): fecha seleccionable y export CSV. Almacen = ORIGEN.
import { useEffect, useState } from 'react'
import { historialTraspaso } from '../api/endpoints'
import type { HistorialTraspasoItem } from '../api/types'
import { todayYMD } from '../lib/datetime'
import { downloadCsv } from '../lib/csv'
import { Spinner } from './ui'

interface Props {
  sucursalId: number
  almacenOrigenId: number
  userId: number
}

export function HistorialTraspaso({ sucursalId, almacenOrigenId, userId }: Props) {
  const [fecha, setFecha] = useState<string>(todayYMD())
  const [items, setItems] = useState<HistorialTraspasoItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setError(null)
    historialTraspaso(sucursalId, almacenOrigenId, userId, fecha)
      .then((data) => !cancelled && setItems(data))
      .catch(() => !cancelled && setError('No se pudo cargar el historial.'))
    return () => {
      cancelled = true
    }
  }, [sucursalId, almacenOrigenId, userId, fecha])

  function exportar() {
    if (!items || items.length === 0) return
    const rows: (string | number)[][] = [
      ['codigo', 'descripcion', 'traspaso', 'unidad', 'destino'],
      ...items.map((it) => [it.codigo, it.descripcion, it.traspaso, it.unidad ?? '', it.destino]),
    ]
    downloadCsv(`traspasos_${fecha}.csv`, rows)
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value || todayYMD())}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-brand-500"
        />
        <button
          onClick={exportar}
          disabled={!items || items.length === 0}
          className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          Exportar CSV
        </button>
      </div>

      {items === null && !error && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {error && <p className="py-6 text-center text-sm text-red-600">{error}</p>}
      {items && items.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">Sin traspasos en esa fecha.</p>
      )}

      {items && items.length > 0 && (
        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
          {items.map((it, i) => (
            <li key={`${it.codigo}-${i}`} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{it.descripcion}</p>
                <p className="text-xs text-slate-500">
                  {it.codigo} · → {it.destino}
                </p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">{it.traspaso}</p>
                <p className="text-xs text-slate-500">{it.unidad ?? ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
