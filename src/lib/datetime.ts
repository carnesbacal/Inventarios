// Utilidades de fecha. El backend filtra historiales por `created_at LIKE 'fecha%'`,
// asi que el cliente DEBE mandar la fecha/hora local en formato exacto.

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Fecha-hora local en formato 'YYYY-MM-DD HH:mm:ss' (para created_at). */
export function nowForCreatedAt(date: Date = new Date()): string {
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

/** Fecha local en formato 'YYYY-MM-DD' (para filtrar historiales por dia). */
export function todayYMD(date: Date = new Date()): string {
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  return `${y}-${mo}-${d}`
}
