// Tipos del contrato de la API (reconstruidos de la especificacion, seccion 5).

/** Usuario devuelto por POST /api/login. idAlmacen puede ser null. */
export interface Usuario {
  id: number
  nombre: string
  idAlmacen: number | null
  idSucursal: number
  idPuesto: number
}

/**
 * Respuesta de /api/login. Cuando el backend habilite Sanctum devolvera ademas
 * `token`. Mientras no lo mande, la app funciona igual (compatibilidad hacia atras).
 */
export interface LoginResponse extends Usuario {
  token?: string
}

/** Producto completo devuelto por GET /api/productos?sucursal_id&codigo. */
export interface Producto {
  id: number
  sucursal_id: number
  codigo: string
  alterno: string | null
  descripcion: string
  unidad: string | null
  costo: number
  precio: number
  familia: string | null
  departamento: string | null
  created_at?: string
  updated_at?: string
}

/** Item liviano de autocompletar (GET /api/productos/list/...). */
export interface ProductoLite {
  codigo: string
  descripcion: string
  unidad: string | null
}

/** Item del catalogo de sucursal (GET /api/productos/sucursal/{id}). */
export interface ProductoCatalogo {
  codigo: string
  descripcion: string
  unidad: string | null
  alterno: string | null
}

/** Almacen destino para traspasos (GET /api/almacenes/list/{id}). */
export interface Almacen {
  id: number
  almacen: string
}

/**
 * Producto normalizado para capturar. Unifica lo que devuelve la busqueda por API
 * (Producto), el catalogo offline (ProductoCatalogo) y el autocompletar (ProductoLite).
 * `codigo` es SIEMPRE el PLU que se guarda.
 */
export interface ResolvedProduct {
  codigo: string
  descripcion: string
  unidad: string | null
  alterno?: string | null
}

/** Fila del historial de conteos (GET /api/inventario/historial/...). */
export interface HistorialInventarioItem {
  codigo: string
  descripcion: string
  cantidad: number
  unidad: string | null
  estante: number
}

/** Fila del historial de traspasos (GET /api/traspaso/historial/...). */
export interface HistorialTraspasoItem {
  codigo: string
  descripcion: string
  traspaso: number
  unidad: string | null
  destino: string
}

/** Payload para POST /api/inventario. */
export interface GuardarInventarioPayload {
  user_id: number
  sucursal_id: number
  almacen_id: number
  codigo: string // PLU (producto.codigo), NO el barcode crudo
  cantidad: number
  estante: number
  created_at: string // 'YYYY-MM-DD HH:mm:ss'
}

/** Payload para POST /api/traspaso. */
export interface GuardarTraspasoPayload {
  user_id: number
  sucursal_id: number
  almaceno_id: number // origen
  almacend_id: number // destino
  codigo: string // PLU (producto.codigo)
  traspaso: number
  status: 'P'
  created_at: string // 'YYYY-MM-DD HH:mm:ss'
}
