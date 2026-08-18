// Historial de conteos (seccion 5.7): fecha seleccionable, filtro por estante y export CSV.
import { useEffect, useState } from 'react'
import { historialInventario } from '../api/endpoints'
import type { HistorialInventarioItem } from '../api/types'
import { todayYMD } from '../lib/datetime'
import { downloadCsv } from '../lib/csv'
import { Spinner } from './ui'

interface Props {
  sucursalId: number
  almacenId: number
  userId: number
  estante?: number
}

export function HistorialInventario({ sucursalId, almacenId, userId, estante }: Props) {
  const [fecha, setFecha] = useState<string>(todayYMD())
  const [items, setItems] = useState<HistorialInventarioItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [soloEstante, setSoloEstante] = useState(false)

  useEffect(() => {
    let cancelled = false
    setItems(null)
    setError(null)
    historialInventario(sucursalId, almacenId, userId, fecha, soloEstante ? estante : undefined)
      .then((data) => !cancelled && setItems(data))
      .catch(() => !cancelled && setError('No se pudo cargar el historial.'))
    return () => {
      cancelled = true
    }
  }, [sucursalId, almacenId, userId, estante, soloEstante, fecha])

  function exportar() {
    if (!items || items.length === 0) return
    const rows: (string | number)[][] = [
      ['codigo', 'descripcion', 'cantidad', 'unidad', 'estante'],
      ...items.map((it) => [it.codigo, it.descripcion, it.cantidad, it.unidad ?? '', it.estante]),
    ]
    downloadCsv(`inventario_${fecha}.csv`, rows)
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

      {estante !== undefined && (
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={soloEstante}
            onChange={(e) => setSoloEstante(e.target.checked)}
          />
          Solo estante {estante}
        </label>
      )}

      {items === null && !error && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {error && <p className="py-6 text-center text-sm text-red-600">{error}</p>}
      {items && items.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">Sin conteos en esa fecha.</p>
      )}

      {items && items.length > 0 && (
        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
          {items.map((it, i) => (
            <li
              key={`${it.codigo}-${it.estante}-${i}`}
              className="flex items-center justify-between py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{it.descripcion}</p>
                <p className="text-xs text-slate-500">
                  {it.codigo} · Estante {it.estante}
                </p>
              </div>
              <div className="ml-3 shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">{it.cantidad}</p>
                <p className="text-xs text-slate-500">{it.unidad ?? ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
