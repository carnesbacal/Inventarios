// Aviso de "nueva version disponible" cuando se despliega una actualizacion.
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center p-3">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-navy-800 bg-navy-900 px-4 py-3 shadow-soft">
        <span className="text-sm text-white">Nueva version disponible</span>
        <div className="flex gap-2">
          <button
            onClick={() => setNeedRefresh(false)}
            className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:text-white"
          >
            Luego
          </button>
          <button
            onClick={() => void updateServiceWorker(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-400"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}
