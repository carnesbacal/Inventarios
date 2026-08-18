// Configuracion central de la app. Los valores vienen de variables de entorno (.env).

const rawBase = import.meta.env.VITE_API_BASE as string | undefined

if (!rawBase) {
  // Aviso temprano en desarrollo si falta la variable.
  console.warn('[config] VITE_API_BASE no esta definido. Revisa tu archivo .env')
}

// Quitamos slash final por si acaso, para construir rutas de forma consistente.
export const API_BASE = (rawBase ?? '').replace(/\/+$/, '')

// Estante por defecto para pruebas (sirve para filtrar/limpiar registros de prueba).
export const TEST_ESTANTE = Number(import.meta.env.VITE_TEST_ESTANTE ?? 99)
