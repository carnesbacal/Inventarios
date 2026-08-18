// Persistencia de la "sesion". La API no usa tokens: solo guardamos el usuario del login.
import type { Usuario } from '../api/types'

const KEY = 'inv_session_user'
const TOKEN_KEY = 'inv_token'

export function saveSession(user: Usuario): void {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function loadSession(): Usuario | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    localStorage.removeItem(KEY)
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(TOKEN_KEY)
}

// --- Token de autenticacion (Sanctum). Opcional hasta que el backend lo emita. ---
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

// --- "Recordar mis datos" (comodidad en dispositivo interno) ---
// Nota: la API no usa tokens, asi que guardamos las credenciales localmente
// para no teclearlas cada vez. Es un equipo interno; puede desactivarse.
const REMEMBER_KEY = 'inv_remember'

export interface RememberedCreds {
  email: string
  password: string
}

export function saveRemember(creds: RememberedCreds): void {
  try {
    localStorage.setItem(REMEMBER_KEY, btoa(encodeURIComponent(JSON.stringify(creds))))
  } catch {
    /* ignore */
  }
}

export function loadRemember(): RememberedCreds | null {
  const raw = localStorage.getItem(REMEMBER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(atob(raw))) as RememberedCreds
  } catch {
    return null
  }
}

export function clearRemember(): void {
  localStorage.removeItem(REMEMBER_KEY)
}
