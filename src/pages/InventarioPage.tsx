import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { buscarProductoPorCodigo, listarPorDescripcion, todosLosAlmacenes } from '../api/endpoints'
import type {
  Almacen,
  GuardarInventarioPayload,
  ProductoLite,
  ResolvedProduct,
} from '../api/types'
import { nowForCreatedAt } from '../lib/datetime'
import { errorFeedback, primeAudio, scanFeedback } from '../lib/feedback'
import { enqueue } from '../lib/outbox'
import { resolveFromCatalog } from '../lib/catalog'
import { useWakeLock } from '../lib/useWakeLock'
import { AppBar, Button, Screen, Sheet, Spinner, TextField } from '../components/ui'
import { HistorialInventario } from '../components/HistorialInventario'

// Carga diferida: la libreria de escaneo (ZXing) solo se descarga al abrir la camara.
const BarcodeScanner = lazy(() =>
  import('../components/BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })),
)

interface SelItem {
  codigo: string
  descripcion: string
  unidad: string | null
}

const ESTANTE_KEY = 'inv_estante'
const fieldCls =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export function InventarioPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [almacenId, setAlmacenId] = useState<number | null>(user?.idAlmacen ?? null)
  const [estante, setEstante] = useState<number>(() => {
    const saved = localStorage.getItem(ESTANTE_KEY)
    return saved ? Number(saved) : 1
  })

  const [scannerOpen, setScannerOpen] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected] = useState<SelItem | null>(null)
  const [candidates, setCandidates] = useState<ResolvedProduct[] | null>(null)
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [sessionCount, setSessionCount] = useState(0)
  const [sessionItems, setSessionItems] = useState<
    { codigo: string; descripcion: string; cantidad: number; unidad: string | null }[]
  >([])

  const [histOpen, setHistOpen] = useState(false)

  const [manualCode, setManualCode] = useState('')
  const [descQuery, setDescQuery] = useState('')
  const [descResults, setDescResults] = useState<ProductoLite[]>([])
  const [descLoading, setDescLoading] = useState(false)

  const cantidadRef = useRef<HTMLInputElement>(null)
  const sucursalId = user?.idSucursal ?? 0

  useWakeLock(true)

  useEffect(() => {
    localStorage.setItem(ESTANTE_KEY, String(estante))
  }, [estante])

  useEffect(() => {
    todosLosAlmacenes()
      .then(setAlmacenes)
      .catch(() => {})
  }, [])

  const almacenNombre = useMemo(
    () => almacenes.find((a) => a.id === almacenId)?.almacen,
    [almacenes, almacenId],
  )

  useEffect(() => {
    const q = descQuery.trim()
    if (q.length < 2) {
      setDescResults([])
      return
    }
    setDescLoading(true)
    const t = setTimeout(() => {
      listarPorDescripcion(sucursalId, q)
        .then((r) => setDescResults(r))
        .catch(() => setDescResults([]))
        .finally(() => setDescLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [descQuery, sucursalId])

  function resetCaptura() {
    setSelected(null)
    setCandidates(null)
    setNotFoundCode(null)
    setCantidad('')
  }

  async function resolverCodigo(code: string) {
    setErr(null)
    setMsg(null)
    setResolving(true)
    resetCaptura()
    try {
      let productos: ResolvedProduct[] = []
      if (navigator.onLine) {
        try {
          productos = await buscarProductoPorCodigo(sucursalId, code)
        } catch (e) {
          productos = await resolveFromCatalog(sucursalId, code)
          if (productos.length === 0 && e instanceof ApiError && e.status !== 0) throw e
        }
      } else {
        productos = await resolveFromCatalog(sucursalId, code)
      }

      if (productos.length === 0) {
        errorFeedback()
        setNotFoundCode(code)
      } else if (productos.length === 1) {
        selectProducto(productos[0])
      } else {
        setCandidates(productos)
      }
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Error al buscar el producto.')
    } finally {
      setResolving(false)
    }
  }

  function selectProducto(p: ResolvedProduct) {
    setCandidates(null)
    setNotFoundCode(null)
    setSelected({ codigo: p.codigo, descripcion: p.descripcion, unidad: p.unidad })
    setCantidad('')
    setTimeout(() => cantidadRef.current?.focus(), 50)
  }

  function onDetected(code: string) {
    setScannerOpen(false)
    void resolverCodigo(code)
  }

  function onManualBuscar() {
    const c = manualCode.trim()
    if (!c) return
    void resolverCodigo(c)
    setManualCode('')
  }

  function guardar() {
    if (!user || !selected) return
    if (almacenId == null) {
      setErr('Selecciona un almacen antes de guardar.')
      return
    }
    const cant = Number(cantidad.replace(',', '.'))
    if (!Number.isFinite(cant) || cant <= 0) {
      setErr('Captura una cantidad valida (> 0).')
      return
    }
    setErr(null)
    const payload: GuardarInventarioPayload = {
      user_id: user.id,
      sucursal_id: sucursalId,
      almacen_id: almacenId,
      codigo: selected.codigo, // PLU, NO el barcode crudo
      cantidad: cant,
      estante,
      created_at: nowForCreatedAt(),
    }
    enqueue({
      kind: 'inventario',
      payload,
      label: `${selected.descripcion} · ${cant} ${selected.unidad ?? ''} · est.${estante}`,
      createdAt: payload.created_at,
    })
    scanFeedback()
    setSessionCount((n) => n + 1)
    setSessionItems((list) => [
      {
        codigo: selected.codigo,
        descripcion: selected.descripcion,
        cantidad: cant,
        unidad: selected.unidad,
      },
      ...list,
    ])
    setMsg(`Guardado: ${selected.descripcion} (${cant} ${selected.unidad ?? ''})`)
    resetCaptura()
  }

  if (!user) return null

  return (
    <Screen>
      <AppBar
        title="Inventario"
        subtitle={almacenNombre ? `Almacen: ${almacenNombre}` : undefined}
        right={
          <button
            onClick={() => navigate('/')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Menu
          </button>
        }
      />

      {/* Configuracion: almacen + estante */}
      <div className="grid grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Almacen
          </span>
          <select
            value={almacenId ?? ''}
            onChange={(e) => setAlmacenId(e.target.value ? Number(e.target.value) : null)}
            className={fieldCls}
          >
            <option value="">Selecciona...</option>
            {almacenes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.almacen}
              </option>
            ))}
            {almacenes.length === 0 && almacenId != null && (
              <option value={almacenId}>Almacen {almacenId}</option>
            )}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estante
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={estante}
            onChange={(e) => setEstante(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className={fieldCls}
          />
        </label>
      </div>

      <div className="flex-1 space-y-4 px-4 py-4">
        <Button
          onClick={() => {
            primeAudio()
            setScannerOpen(true)
          }}
          disabled={almacenId == null}
        >
          Escanear producto
        </Button>
        {almacenId == null && (
          <p className="-mt-2 text-center text-xs text-amber-600">
            Selecciona un almacen para comenzar.
          </p>
        )}

        {/* Entrada manual */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Entrada manual
          </p>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onManualBuscar()}
              placeholder="Codigo o alterno"
              inputMode="numeric"
              className={fieldCls}
            />
            <button
              onClick={onManualBuscar}
              className="shrink-0 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Buscar
            </button>
          </div>
          <input
            value={descQuery}
            onChange={(e) => setDescQuery(e.target.value)}
            placeholder="...o buscar por descripcion"
            className={`mt-2 ${fieldCls}`}
          />
          {descLoading && <p className="mt-2 text-xs text-slate-400">Buscando...</p>}
          {descResults.length > 0 && (
            <ul className="mt-2 max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {descResults.map((r) => (
                <li key={r.codigo}>
                  <button
                    onClick={() => {
                      selectProducto(r)
                      setDescQuery('')
                      setDescResults([])
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-sm text-slate-800">{r.descripcion}</span>
                    <span className="shrink-0 text-xs text-slate-400">{r.codigo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {resolving && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Spinner /> Buscando producto...
          </div>
        )}

        {notFoundCode && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No se encontro el codigo <span className="font-mono">{notFoundCode}</span>. Verifica o
            busca por descripcion.
          </div>
        )}

        {msg && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            <span className="min-w-0 truncate">{msg}</span>
            <button
              onClick={() => {
                primeAudio()
                setScannerOpen(true)
              }}
              disabled={almacenId == null}
              className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Escanear siguiente
            </button>
          </div>
        )}
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Contador + historial */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
          <div className="text-sm">
            <span className="text-slate-500">Capturados en esta sesion: </span>
            <span className="font-bold text-brand-600">{sessionCount}</span>
          </div>
          <button
            onClick={() => setHistOpen(true)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Historial de hoy
          </button>
        </div>

        {sessionItems.length > 0 && (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {sessionItems.slice(0, 8).map((it, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2">
                <span className="min-w-0 truncate text-sm text-slate-700">{it.descripcion}</span>
                <span className="ml-2 shrink-0 text-sm font-semibold text-slate-900">
                  {it.cantidad} {it.unidad ?? ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {scannerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black text-white">
              <Spinner /> <span className="ml-2 text-sm">Iniciando camara...</span>
            </div>
          }
        >
          <BarcodeScanner onDetected={onDetected} onClose={() => setScannerOpen(false)} />
        </Suspense>
      )}

      {/* Captura de cantidad */}
      <Sheet open={selected !== null} onClose={resetCaptura} title="Capturar cantidad">
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-semibold text-slate-900">{selected.descripcion}</p>
              <p className="text-xs text-slate-500">
                PLU {selected.codigo} · {selected.unidad ?? 's/u'} · Estante {estante}
              </p>
            </div>
            <TextField
              ref={cantidadRef}
              label={`Cantidad (${selected.unidad ?? 'unid.'})`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && guardar()}
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={resetCaptura} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={guardar} className="flex-1">
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={candidates !== null} onClose={resetCaptura} title="Varias coincidencias">
        {candidates && (
          <ul className="divide-y divide-slate-100">
            {candidates.map((p) => (
              <li key={p.codigo}>
                <button
                  onClick={() => selectProducto(p)}
                  className="flex w-full items-center justify-between gap-2 px-1 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-900">{p.descripcion}</span>
                    <span className="text-xs text-slate-500">
                      PLU {p.codigo}
                      {p.alterno ? ` · alt ${p.alterno}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-brand-600">Elegir</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={histOpen} onClose={() => setHistOpen(false)} title="Historial">
        {almacenId != null ? (
          <HistorialInventario
            sucursalId={sucursalId}
            almacenId={almacenId}
            userId={user.id}
            estante={estante}
          />
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">Selecciona un almacen.</p>
        )}
      </Sheet>
    </Screen>
  )
}
