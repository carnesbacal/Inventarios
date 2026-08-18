// Catalogo de la sucursal cacheado en IndexedDB, para resolver escaneos offline
// y sin round-trip. Se refresca manualmente desde el menu.
import { idbGet, idbSet } from './idb'
import { catalogoSucursal } from '../api/endpoints'
import type { ProductoCatalogo, ResolvedProduct } from '../api/types'

interface CatalogCache {
  fetchedAt: string
  items: ProductoCatalogo[]
}

const key = (sucursalId: number) => `catalogo_${sucursalId}`

export async function getCatalogInfo(
  sucursalId: number,
): Promise<{ count: number; fetchedAt: string | null }> {
  const c = await idbGet<CatalogCache>(key(sucursalId))
  return { count: c?.items.length ?? 0, fetchedAt: c?.fetchedAt ?? null }
}

export async function refreshCatalog(sucursalId: number): Promise<number> {
  const items = await catalogoSucursal(sucursalId)
  const cache: CatalogCache = { fetchedAt: new Date().toISOString(), items }
  await idbSet(key(sucursalId), cache)
  return items.length
}

/** Resuelve un codigo escaneado contra el catalogo cacheado (codigo O alterno). */
export async function resolveFromCatalog(
  sucursalId: number,
  code: string,
): Promise<ResolvedProduct[]> {
  const c = await idbGet<CatalogCache>(key(sucursalId))
  if (!c) return []
  const q = code.trim()
  return c.items
    .filter((p) => p.codigo === q || (p.alterno != null && p.alterno === q))
    .map((p) => ({
      codigo: p.codigo,
      descripcion: p.descripcion,
      unidad: p.unidad,
      alterno: p.alterno,
    }))
}
