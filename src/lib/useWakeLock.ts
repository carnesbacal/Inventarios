// Mantiene la pantalla encendida mientras se cuenta (Wake Lock API).
// iOS 16.4+ y Android Chrome lo soportan; en el resto es no-op silencioso.
import { useEffect } from 'react'

type WakeLockSentinelLike = { release: () => Promise<void> }

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    let sentinel: WakeLockSentinelLike | null = null

    const request = async () => {
      try {
        const wl = (navigator as unknown as {
          wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> }
        }).wakeLock
        if (wl) sentinel = await wl.request('screen')
      } catch {
        /* ignore */
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      try {
        void sentinel?.release()
      } catch {
        /* ignore */
      }
    }
  }, [active])
}
