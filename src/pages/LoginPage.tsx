import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'
import { clearRemember, loadRemember, saveRemember } from '../auth/session'
import { BRAND, DEV_SIGNATURE } from '../brand'

const UserIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </svg>
)
const LockIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)

const inputCls =
  'w-full rounded-xl border border-white/15 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-white/40 outline-none transition focus:border-brand-400 focus:bg-white/10 focus:ring-2 focus:ring-brand-400/30'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Precarga credenciales recordadas.
  useEffect(() => {
    const r = loadRemember()
    if (r) {
      setEmail(r.email)
      setPassword(r.password)
      setRemember(true)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      if (remember) saveRemember({ email: email.trim(), password })
      else clearRemember()
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Credenciales invalidas.')
        else if (err.status === 404) setError('Usuario no encontrado.')
        else if (err.status === 422) setError('Revisa el correo y la contrasena.')
        else if (err.status === 0) setError(err.message)
        else setError(err.message || 'No se pudo iniciar sesion.')
      } else {
        setError('Ocurrio un error inesperado.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-b from-navy-800 via-navy-900 to-navy-950 text-white">
      {/* Textura y brillos */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-32 h-64 w-64 rounded-full bg-brand-700/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-6 pt-14">
        {/* Marca */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black text-white shadow-soft ring-1 ring-white/15">
            B
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-[0.05em]">CARNES BACAL</h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.32em] text-brand-300">
            Inventarios
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {BRAND.system}
          </span>
          <p className="mt-3 max-w-[17rem] text-[11px] leading-snug text-white/40">
            {BRAND.fullName}
          </p>
        </div>

        {/* Tarjeta glass */}
        <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-soft backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white">Iniciar sesion</h2>
          <p className="mb-5 mt-0.5 text-sm text-white/55">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/60">
                Correo
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45">
                  {UserIcon}
                </span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  placeholder="usuario@dominio.com"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/60">
                Contrasena
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45">
                  {LockIcon}
                </span>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="********"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-white/60 hover:text-white"
                >
                  {showPwd ? 'Ocultar' : 'Ver'}
                </button>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/80">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-white/10 accent-brand-500"
              />
              Recordar mis datos
            </label>

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3.5 text-base font-semibold text-white shadow-soft transition hover:from-brand-400 hover:to-brand-500 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Iniciar sesion →'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/45">
            ¿Problemas para acceder? Contacta al area de Sistemas.
          </p>
        </div>

        <div className="flex-1" />
        <div className="pt-6 text-center text-[11px] text-white/40">
          <p>
            {'Desarrollado por '}
            <span className="font-mono">{DEV_SIGNATURE}</span>
            {` · ${BRAND.version}`}
          </p>
          <p className="mt-0.5">{`© ${BRAND.year} ${BRAND.company} · Uso interno`}</p>
        </div>
      </div>
    </div>
  )
}
