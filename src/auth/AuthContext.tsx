import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Usuario } from '../api/types'
import { login as apiLogin } from '../api/endpoints'
import { clearSession, loadSession, saveSession } from './session'

interface AuthState {
  user: Usuario | null
  signIn: (email: string, password: string) => Promise<Usuario>
  signOut: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(() => loadSession())

  const value = useMemo<AuthState>(
    () => ({
      user,
      async signIn(email, password) {
        const u = await apiLogin(email, password)
        saveSession(u)
        setUser(u)
        return u
      },
      signOut() {
        clearSession()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
