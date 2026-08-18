# App Inventario Bacal (PWA)

Reemplazo web de la app Android de inventario. Cliente 100% front-end que consume la
API Laravel existente (Railway). **No modifica el backend.**

Stack: Vite + React + TypeScript + Tailwind CSS + PWA (vite-plugin-pwa). Escaneo con ZXing
(fases siguientes).

## Requisitos

- Node.js 18+ (recomendado 20/22).

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

La configuración vive en `.env` (ya incluido):

```
VITE_API_BASE=https://almacenes-dashboard-production.up.railway.app/api
VITE_TEST_ESTANTE=999
```

## Cámara y HTTPS (cómo probar el escáner)

La cámara del navegador solo funciona en **contexto seguro**: `localhost`/`127.0.0.1` o HTTPS.
Si abres la URL de red (`http://192.168.x.x:5173`) o entras desde el celular por esa IP, el
navegador **bloquea la cámara**. Es una regla del navegador, no un fallo de la app.

**1) En tu PC (rápido, con la webcam):**

```bash
npm run dev
```

Abre EXACTAMENTE `http://localhost:5173` (no la de "Network"). La cámara abre sin más.

**2) En el celular por Wi‑Fi (HTTPS con certificado autofirmado):**

```bash
npm run dev:https
```

En el teléfono abre `https://<IP-de-tu-PC>:5173`. Aparecerá un aviso de "sitio no seguro"
(por el certificado autofirmado): acéptalo para continuar.

- En **Android** funciona bien tras aceptar el aviso.
- En **iPhone** el certificado autofirmado a veces sigue bloqueando la cámara. Si es tu caso,
  usa la opción 3.

**3) En iPhone/Android con HTTPS real (lo más confiable) — túnel:**

Deja `npm run dev` corriendo y en otra terminal levanta un túnel (elige uno):

```bash
# Cloudflare (gratis, sin cuenta):
cloudflared tunnel --url http://localhost:5173

# o ngrok:
ngrok http 5173
```

Te dará una URL `https://....trycloudflare.com` (o de ngrok). Ábrela en el teléfono: al ser
HTTPS real, la cámara funciona en iPhone y Android sin avisos.

> Entrada manual y lector Bluetooth funcionan sin cámara/HTTPS en cualquier caso.
> En producción (intranet por HTTPS) nada de esto hace falta: la cámara funciona directo.

## Estructura

```
src/
  config.ts            # API_BASE y ajustes desde .env
  lib/datetime.ts      # formato de fecha para created_at e historiales
  api/
    types.ts           # tipos del contrato de la API (sección 5 de la spec)
    client.ts          # wrapper de fetch + manejo de errores (ApiError)
    endpoints.ts       # una función por endpoint (login, productos, inventario, traspaso...)
  auth/
    session.ts         # sesión en localStorage (la API no usa tokens)
    AuthContext.tsx    # contexto de auth (signIn/signOut)
    RequireAuth.tsx    # protección de rutas privadas
  components/ui.tsx    # componentes base (Button, TextField, Screen, AppBar)
  pages/
    LoginPage.tsx      # login contra POST /api/login
    MenuPage.tsx       # menú (Inventario, Traspasos, Cerrar sesión)
    PlaceholderPage.tsx# pantallas temporales de fases siguientes
```

## Estado por fases

- [x] **Fase 1** — Fundación: scaffold, cliente HTTP tipado con todos los endpoints,
      sesión, login y menú.
- [x] **Fase 2** — Inventario (conteo): escáner ZXing (carga diferida) + entrada manual
      (código y descripción) + captura de cantidad/estante + historial del día.
- [x] **Fase 3** — Traspasos: origen + selector de destino, escáner/manual, cantidad a
      traspasar, guardado con `status "P"` e historial del día.
- [x] **Mejoras (pre-diseño):** cola offline con reintento (los guardados nunca se pierden
      aunque falle la red) + indicador de pendientes; caché del catálogo de sucursal para
      resolver escaneos sin red; Wake Lock; linterna y cambio de cámara en el escáner;
      historial con selector de fecha y export CSV; aviso de nueva versión.
- [x] **Fase 4** — Diseño / identidad visual (paleta azul "Auditoría", tema claro, login con
      hero navy, logo, versión, "uso interno" y firma `<LFRC/> · <PARIOS/>`).
- [ ] **Fase 5** — Pruebas en dispositivos reales + deploy a Railway.
- [ ] **Fase 6 (futuro)** — Autenticación por token (Sanctum) en el backend.

## Personalizar la marca (favicon, íconos, versión)

Dejé un placeholder navy on-brand; para poner el favicon oficial, **reemplaza estos archivos**
en la carpeta `public/` (mismos nombres):

- `public/favicon.ico` — favicon de la pestaña del navegador (el que subes tú).
- `public/favicon.svg` — versión vectorial opcional del favicon.
- `public/apple-touch-icon.png` — 180×180, ícono al "Agregar a inicio" en iPhone.
- `public/pwa-192.png` y `public/pwa-512.png` — íconos de la PWA (Android / instalada).

No hay que tocar código: al reconstruir (`npm run build`), esos archivos se copian tal cual.

La **versión**, el año y la firma del desarrollador viven en `src/brand.ts`
(`version: 'v1.0.0'`, `developers: ['LFRC', 'PARIOS']`). Sube la versión ahí en cada release
y aparece en el login y en el footer.

## Reglas de negocio clave (recordatorio)

- Al **guardar** un conteo/traspaso se manda `producto.codigo` (PLU), **nunca** el código de
  barras crudo (los reportes del panel cruzan por `codigo`).
- Al **escanear** se busca por `codigo` **o** `alterno` (`GET /api/productos`).
- `created_at` lo pone el cliente en formato `YYYY-MM-DD HH:mm:ss`.
- Traspasos siempre con `status: "P"`.
- Todo segmentado por `sucursal_id` (del usuario logueado).
```
