// Escaner de codigo de barras. Prioridad de motor (rendimiento + precision):
//  1) BarcodeDetector NATIVO (Android/Chrome): deteccion por hardware, casi instantanea.
//  2) Polyfill con ZXing-WASM (barcode-detector): motor en WebAssembly, mucho mas rapido
//     y OMNIDIRECCIONAL (lee rotado/al reves) que el viejo ZXing en JS. Cubre iOS Safari.
// El .wasm se sirve localmente (bundle) para funcionar offline y en subcarpeta.
import { useEffect, useRef, useState } from 'react'
import { primeAudio, scanFeedback } from '../lib/feedback'

interface Props {
  onDetected: (code: string) => void
  onClose: () => void
}

// Formatos 1D tipicos de producto (nombres de la API BarcodeDetector).
const FORMAT_STRINGS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']

interface Cam {
  deviceId: string
  label: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDetector = { detect: (src: any) => Promise<Array<{ rawValue: string }>> }

// Carga el polyfill WASM una sola vez y configura el .wasm local.
let polyfillCtor: Promise<new (opts: { formats: string[] }) => AnyDetector> | null = null
function loadPolyfill() {
  if (!polyfillCtor) {
    polyfillCtor = (async () => {
      const [mod, wasmMod] = await Promise.all([
        import('barcode-detector'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ])
      const wasmUrl = (wasmMod as { default: string }).default
      mod.setZXingModuleOverrides({
        locateFile: (path: string, prefix: string) =>
          path.endsWith('.wasm') ? wasmUrl : prefix + path,
      })
      return mod.BarcodeDetector as unknown as new (opts: { formats: string[] }) => AnyDetector
    })()
  }
  return polyfillCtor
}

async function getDetector(): Promise<AnyDetector> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Native = (window as any).BarcodeDetector
  if (Native) {
    try {
      const supported: string[] = await Native.getSupportedFormats()
      const fs = FORMAT_STRINGS.filter((f) => supported.includes(f))
      if (fs.length > 0) return new Native({ formats: fs }) as AnyDetector
    } catch {
      /* cae al polyfill */
    }
  }
  const Ctor = await loadPolyfill()
  return new Ctor({ formats: FORMAT_STRINGS })
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const stoppedRef = useRef(false)
  const genRef = useRef(0)
  const lastRef = useRef<{ code: string; t: number }>({ code: '', t: 0 })
  const onDetectedRef = useRef(onDetected)

  const [error, setError] = useState<string | null>(null)
  const [cams, setCams] = useState<Cam[]>([])
  const [camIndex, setCamIndex] = useState(0)
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)

  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  function emit(code: string) {
    const c = (code ?? '').trim()
    if (!c) return
    const now = Date.now()
    if (lastRef.current.code === c && now - lastRef.current.t < 1500) return
    lastRef.current = { code: c, t: now }
    scanFeedback()
    onDetectedRef.current(c)
  }

  function getTrack(): MediaStreamTrack | undefined {
    return streamRef.current?.getVideoTracks?.()[0]
  }

  function inspectCapabilities() {
    const track = getTrack()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const caps = track?.getCapabilities?.() as any
    setTorchSupported(!!caps?.torch)
    setTorchOn(false)
    try {
      if (Array.isArray(caps?.focusMode) && caps.focusMode.includes('continuous')) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        void track!.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any)
      }
    } catch {
      /* ignore */
    }
  }

  async function openStream(deviceId?: string): Promise<MediaStream> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video: any = deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: 'environment' } }
    // Resolucion alta para precision, pero acotada para no ahogar equipos modestos.
    video.width = { ideal: 1920 }
    video.height = { ideal: 1080 }
    return navigator.mediaDevices.getUserMedia({ video, audio: false })
  }

  function runLoop(detector: AnyDetector, gen: number) {
    const loop = async () => {
      if (stoppedRef.current || gen !== genRef.current) return
      const v = videoRef.current
      if (v && v.readyState >= 2) {
        try {
          const codes = await detector.detect(v)
          if (codes && codes.length) emit(codes[0].rawValue)
        } catch {
          /* frame no listo: seguir */
        }
      }
      if (!stoppedRef.current && gen === genRef.current) {
        rafRef.current = requestAnimationFrame(loop)
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  async function start(deviceId?: string) {
    const gen = ++genRef.current
    const stream = await openStream(deviceId)
    if (gen !== genRef.current) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play().catch(() => {})
    }
    inspectCapabilities()
    const detector = await getDetector()
    if (gen !== genRef.current) return
    runLoop(detector, gen)
  }

  function teardownEngine() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    } catch {
      /* ignore */
    }
    streamRef.current = null
  }

  async function switchCam() {
    if (cams.length < 2) return
    const next = (camIndex + 1) % cams.length
    setCamIndex(next)
    teardownEngine()
    try {
      await start(cams[next].deviceId)
    } catch {
      setError('No se pudo cambiar de camara.')
    }
  }

  async function toggleTorch() {
    const track = getTrack()
    if (!track) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as any)
      setTorchOn((v) => !v)
    } catch {
      /* ignore */
    }
  }

  async function loadCams() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const vids = devices.filter((d) => d.kind === 'videoinput')
      const back = vids.filter((d) => /back|rear|environment|trase|posterior/i.test(d.label))
      const list = (back.length ? back : vids).map((d) => ({
        deviceId: d.deviceId,
        label: d.label || 'Camara',
      }))
      setCams(list)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    stoppedRef.current = false
    primeAudio()

    if (!window.isSecureContext) {
      setError('La camara requiere HTTPS. Abre la app por https:// (o localhost) para escanear.')
      return
    }

    void (async () => {
      try {
        await start()
        await loadCams()
      } catch (e) {
        const name = (e as { name?: string })?.name
        if (name === 'NotAllowedError')
          setError('Permiso de camara denegado. Actívalo en el navegador e intenta de nuevo.')
        else if (name === 'NotFoundError')
          setError('No se encontro una camara en el dispositivo.')
        else setError('No se pudo iniciar la camara. Usa la entrada manual como respaldo.')
      }
    })()

    return () => {
      stoppedRef.current = true
      genRef.current++
      teardownEngine()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">Escanear codigo</span>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              className={`rounded-lg px-3 py-1 text-sm ${torchOn ? 'bg-amber-400 text-black' : 'bg-white/10'}`}
            >
              {torchOn ? '🔦 On' : '🔦 Flash'}
            </button>
          )}
          {cams.length > 1 && (
            <button onClick={switchCam} className="rounded-lg bg-white/10 px-3 py-1 text-sm">
              ⟳ Camara
            </button>
          )}
          <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-sm">
            Cerrar
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        {!error && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="scanline absolute left-0 right-0 h-0.5 bg-brand-400 shadow-[0_0_10px_3px] shadow-brand-400/60" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="rounded-xl bg-red-950/80 px-4 py-3 text-sm text-red-100">{error}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 text-center text-xs text-white/70">
        Apunta al codigo en cualquier parte de la pantalla. Se lee solo.
      </div>
    </div>
  )
}
