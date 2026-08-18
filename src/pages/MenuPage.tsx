import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getCatalogInfo, refreshCatalog } from '../lib/catalog'
import { BRAND } from '../brand'
import { Footer, Logo, Overline, Screen } from '../components/ui'

function saludo(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos dias'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).slice(0, 2)
  return parts.map((w) => w[0]?.toUpperCase() ?? '').join('') || 'U'
}

function haceCuanto(iso: string | null): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

const InvIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </svg>
)
const TrasIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7h13l-3-3" />
    <path d="M20 17H7l3 3" />
  </svg>
)

export function MenuPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [catCount, setCatCount] = useState(0)
  const [catFecha, setCatFecha] = useState<string | null>(null)
  const [catBusy, setCatBusy] = useState(false)
  const [catMsg, setCatMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getCatalogInfo(user.idSucursal).then((info) => {
      setCatCount(info.count)
      setCatFecha(info.fetchedAt)
    })
  }, [user])

  async function actualizarCatalogo() {
    if (!user) return
    setCatBusy(true)
    setCatMsg(null)
    try {
      const n = await refreshCatalog(user.idSucursal)
      const info = await getCatalogInfo(user.idSucursal)
      setCatCount(n)
      setCatFecha(info.fetchedAt)
      setCatMsg(`Catalogo actualizado: ${n} productos.`)
    } catch {
      setCatMsg('No se pudo descargar el catalogo (revisa la conexion).')
    } finally {
      setCatBusy(false)
    }
  }

  if (!user) return null

  return (
    <Screen>
      {/* Barra superior clara (estilo dashboard) */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Logo subtitle={BRAND.app} />
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {iniciales(user.nombre)}
          </span>
          <button
            onClick={signOut}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex-1 px-5 pt-5">
        {/* Saludo */}
        <p className="text-sm text-slate-500">{saludo()},</p>
        <h1 className="text-2xl font-bold text-slate-900">{user.nombre}</h1>

        {/* Info sucursal / almacen */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Sucursal
            </p>
            <p className="text-sm font-bold text-slate-900">{user.idSucursal}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Almacen
            </p>
            <p className="text-sm font-bold text-slate-900">
              {user.idAlmacen != null ? user.idAlmacen : 'Sin fijo'}
            </p>
          </div>
        </div>

        {/* Operaciones */}
        <div className="mt-6">
          <Overline>Operaciones</Overline>
        </div>
        <div className="mt-2 grid gap-3">
          <button
            onClick={() => navigate('/inventario')}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-200 active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {InvIcon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-slate-900">Inventario</span>
              <span className="block text-sm text-slate-500">Conteo por estante con escaner</span>
            </span>
            <span className="text-slate-300">›</span>
          </button>

          <button
            onClick={() => navigate('/traspasos')}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-brand-200 active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              {TrasIcon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-slate-900">Traspasos</span>
              <span className="block text-sm text-slate-500">Mover producto entre almacenes</span>
            </span>
            <span className="text-slate-300">›</span>
          </button>
        </div>

        {/* Catalogo offline */}
        <div className="mt-6">
          <Overline>Catalogo offline</Overline>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="text-sm text-slate-600">
              {catCount > 0
                ? `${catCount} productos · actualizado ${haceCuanto(catFecha)}`
                : 'Sin descargar. Permite escanear aunque falle la red.'}
            </p>
            <button
              onClick={actualizarCatalogo}
              disabled={catBusy}
              className="mt-3 inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {catBusy
                ? 'Descargando...'
                : catCount > 0
                  ? 'Actualizar catalogo'
                  : 'Descargar catalogo'}
            </button>
            {catMsg && <p className="mt-2 text-xs text-slate-500">{catMsg}</p>}
          </div>
        </div>

        <div className="mt-6" />
        <Footer />
      </div>
    </Screen>
  )
}
