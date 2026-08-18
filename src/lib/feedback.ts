// Retroalimentacion al escanear: beep (Web Audio) + vibracion.
// iOS Safari no soporta navigator.vibrate (queda como no-op, sin error).

let audioCtx: AudioContext | null = null

/** Debe llamarse desde un gesto del usuario (tap) para habilitar el audio en iOS. */
export function primeAudio(): void {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) audioCtx = new Ctor()
    }
    void audioCtx?.resume()
  } catch {
    /* ignore */
  }
}

export function beep(freq = 880, ms = 120): void {
  try {
    if (!audioCtx) primeAudio()
    if (!audioCtx) return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + ms / 1000)
  } catch {
    /* ignore */
  }
}

export function vibrate(ms = 60): void {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignore */
  }
}

/** Feedback estandar de "lectura exitosa". */
export function scanFeedback(): void {
  beep(880, 110)
  vibrate(60)
}

/** Feedback de error / no encontrado. */
export function errorFeedback(): void {
  beep(220, 180)
  vibrate(120)
}
