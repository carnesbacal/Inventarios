// Componentes UI base. Tema claro con acentos navy/azul (alineado a "Auditoria").
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { BRAND, DEV_SIGNATURE } from '../brand'

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  const base =
    'w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    primary: 'bg-navy-900 text-white hover:bg-navy-800 shadow-soft',
    ghost: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: ReactNode }
>(function TextField({ label, icon, className = '', ...props }, ref) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-slate-300 bg-white py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${className}`}
          {...props}
        />
      </span>
    </label>
  )
})

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-slate-50 text-slate-900">
      {children}
    </div>
  )
}

export function AppBar({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-card ${className}`}>
      {children}
    </div>
  )
}

export function Overline({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`text-xs font-bold uppercase tracking-[0.16em] text-brand-600 ${className}`}
    >
      {children}
    </span>
  )
}

/** Pill de estado con punto (para el hero navy del login). */
export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
      {children}
    </span>
  )
}

/** Marca: cuadro redondeado con inicial + wordmark. */
export function Logo({
  subtitle,
  onDark = false,
  className = '',
}: {
  subtitle?: string
  onDark?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-base font-black text-white shadow-soft ring-1 ring-white/10">
        B
      </span>
      <span className="leading-tight">
        <span
          className={`block text-sm font-extrabold tracking-tight ${
            onDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          CARNES BACAL
        </span>
        <span
          className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
            onDark ? 'text-brand-300' : 'text-brand-600'
          }`}
        >
          {subtitle ?? BRAND.app}
        </span>
      </span>
    </div>
  )
}

/** Firma del desarrollador + version + uso interno. */
export function Footer({ onDark = false }: { onDark?: boolean }) {
  const cls = onDark ? 'text-white/45' : 'text-slate-400'
  return (
    <div className={`px-4 py-4 text-center text-[11px] ${cls}`}>
      <p>
        {'Desarrollado por '}
        <span className="font-mono">{DEV_SIGNATURE}</span>
        {` · ${BRAND.version}`}
      </p>
      <p className="mt-0.5">{`© ${BRAND.year} ${BRAND.company} · Uso interno`}</p>
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 ${className}`}
      aria-label="Cargando"
    />
  )
}

/** Hoja inferior (bottom sheet) para capturas y detalles. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl border-t border-slate-200 bg-white p-4 pb-6 shadow-soft">
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
              Cerrar
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
