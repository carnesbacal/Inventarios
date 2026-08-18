// Funciones tipadas para cada endpoint de la API (seccion 5 de la especificacion).
import { api } from './client'
import type {
  Usuario,
  Producto,
  ProductoLite,
  ProductoCatalogo,
  Almacen,
  HistorialInventarioItem,
  HistorialTraspasoItem,
  GuardarInventarioPayload,
  GuardarTraspasoPayload,
} from './types'

// 5.1 Login
export function login(email: string, password: string): Promise<Usuario> {
  return api.post<Usuario>('/login', { email, password })
}

// 5.2 Buscar producto por codigo escaneado (matchea codigo O alterno)
export function buscarProductoPorCodigo(
  sucursalId: number,
  codigo: string,
): Promise<Producto[]> {
  return api.get<Producto[]>('/productos', { sucursal_id: sucursalId, codigo })
}

// 5.3 Autocompletar por descripcion
export function listarPorDescripcion(
  sucursalId: number,
  descripcion: string,
): Promise<ProductoLite[]> {
  return api.get<ProductoLite[]>(
    `/productos/list/${sucursalId}/${encodeURIComponent(descripcion)}`,
  )
}

// 5.3 Autocompletar por codigo
export function listarPorCodigo(
  sucursalId: number,
  codigo: string,
): Promise<ProductoLite[]> {
  return api.get<ProductoLite[]>(
    `/productos/list/codigo/${sucursalId}/${encodeURIComponent(codigo)}`,
  )
}

// 5.4 Catalogo completo de la sucursal (para cache local/offline)
export function catalogoSucursal(sucursalId: number): Promise<ProductoCatalogo[]> {
  return api.get<ProductoCatalogo[]>(`/productos/sucursal/${sucursalId}`)
}

// 5.5 Almacenes destino (distintos al origen)
export function almacenesDestino(almacenOrigenId: number): Promise<Almacen[]> {
  return api.get<Almacen[]>(`/almacenes/list/${almacenOrigenId}`)
}

// Lista completa de almacenes. list/0 no excluye ninguno -> devuelve todos.
// Util para mostrar el nombre del almacen y para usuarios sin almacen fijo.
export function todosLosAlmacenes(): Promise<Almacen[]> {
  return api.get<Almacen[]>('/almacenes/list/0')
}

// 5.6 Guardar conteo de inventario
export function guardarInventario(payload: GuardarInventarioPayload): Promise<unknown> {
  return api.post('/inventario', payload)
}

// 5.7 Historial de conteos del dia (estante opcional)
export function historialInventario(
  sucursalId: number,
  almacenId: number,
  userId: number,
  fecha: string, // 'YYYY-MM-DD'
  estante?: number,
): Promise<HistorialInventarioItem[]> {
  const base = `/inventario/historial/${sucursalId}/${almacenId}/${userId}/${fecha}`
  const path = estante !== undefined ? `${base}/${estante}` : base
  return api.get<HistorialInventarioItem[]>(path)
}

// 5.8 Guardar traspaso (siempre status 'P')
export function guardarTraspaso(payload: GuardarTraspasoPayload): Promise<unknown> {
  return api.post('/traspaso', payload)
}

// 5.9 Historial de traspasos del dia (almacen aqui es el origen)
export function historialTraspaso(
  sucursalId: number,
  almacenOrigenId: number,
  userId: number,
  fecha: string, // 'YYYY-MM-DD'
): Promise<HistorialTraspasoItem[]> {
  return api.get<HistorialTraspasoItem[]>(
    `/traspaso/historial/${sucursalId}/${almacenOrigenId}/${userId}/${fecha}`,
  )
}
