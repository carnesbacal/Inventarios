# App Inventario — Estado del proyecto y plan de seguridad (tokens)

Documento maestro: **qué ya se hizo** y **qué falta hacer** (proteger la API con
autenticación por token). Sirve como referencia y como *handoff* para el chat del backend.

---

## 1. Datos clave

- **App (front-end):** PWA de inventario y traspasos para teléfonos (iPhone/Android).
- **URL publicada:** `https://intranet.carnesbacal.com.mx/Inventarios/`
- **Repo front-end:** `https://github.com/carnesbacal/Inventarios` (público).
- **Deploy:** cPanel Git Version Control → `.cpanel.yml` copia `dist/` a la subcarpeta.
- **Backend:** Laravel 11 en Railway (repo aparte, auto-deploy por git). **Sin auth hoy.**
- **API base:** `https://almacenes-dashboard-production.up.railway.app/api`

## 2. Lo que YA se hizo (front-end)

- **Stack:** Vite + React + TypeScript + Tailwind + PWA. Rutas relativas + HashRouter
  (portable a cualquier subcarpeta de intranet).
- **Login** contra `POST /api/login`, sesión en `localStorage`, **Recordar mis datos**.
- **Inventario (conteo):** almacén + estante, escaneo, captura de cantidad, guardado con
  `producto.codigo` (PLU), historial del día.
- **Traspasos:** origen + destino, escaneo, cantidad, `status "P"`, historial.
- **Escáner de alto rendimiento:** detector **nativo** (`BarcodeDetector`) en Android +
  **ZXing-WASM** (omnidireccional, lee rotado) en iPhone. Linterna y cambio de cámara.
- **Confiabilidad offline:** cola local con reintento (los guardados no se pierden si falla
  la red), caché del catálogo de sucursal, Wake Lock.
- **Historial** con selector de fecha y **export CSV**; aviso de nueva versión.
- **Diseño** alineado a la app "Auditoría": login inmersivo navy, interior claro tipo
  dashboard, firma `<PARIOS></LFRC>`, versión en `src/brand.ts`.
- **Soporte de token (nuevo):** la app ya guarda el `token` que devuelva el login y lo
  manda como `Authorization: Bearer <token>` en cada petición. **Es compatible hacia
  atrás:** si el backend todavía no manda token, la app funciona igual que hoy. Si un
  request devuelve `401` con sesión activa, cierra sesión y vuelve al login.

## 3. Objetivo ahora: proteger la API

Hoy la API está **abierta** (sin autenticación): cualquiera con la URL puede leer catálogo
(incluye **costos y precios**) o escribir conteos/traspasos. El repo público **no** es la
causa — la URL de la API es visible desde el sitio publicado igual. La solución real es
**autenticación por token (Laravel Sanctum)**, más rate limiting.

## 4. Cambios en el BACKEND (hacer en el otro chat)

> Sanctum ya viene instalado en el proyecto. Mantener **la misma forma de request** en los
> endpoints (siguen recibiendo `user_id`, `sucursal_id`, etc. en el body); el token es
> **adicional**. Así el front no se rompe.

1. **Emitir token en el login.** En el controlador de `POST /api/login`, tras validar
   credenciales, crear un token y devolverlo junto con los datos actuales:

   ```php
   $token = $user->createToken('inventario')->plainTextToken;
   return response()->json([
     'id'        => $user->id,
     'nombre'    => $user->name,
     'idAlmacen' => $user->almacen_id,
     'idSucursal'=> $user->sucursal_id,
     'idPuesto'  => $user->rol_id,   // o el campo que ya usan hoy
     'token'     => $token,          // <-- NUEVO
   ]);
   ```

2. **Proteger las rutas** (todas las `api/*` menos `/login`) con `auth:sanctum`.
   En `routes/api.php`:

   ```php
   Route::post('/login', [AuthController::class, 'login']); // pública

   Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
       // ...aquí TODAS las rutas actuales: productos, inventario, traspaso, almacenes...
   });
   ```

3. **Rate limiting** (incluido arriba con `throttle:60,1` = 60 req/min por token/IP;
   ajusten el número). Frena scraping y spam aunque el token se filtre.

4. **CORS.** Permitir el header `Authorization` y el origen del front. En
   `config/cors.php`: que `allowed_headers` incluya `'Authorization'` (o `['*']`) y
   `allowed_origins` incluya `https://intranet.carnesbacal.com.mx` (o `['*']`).

5. **Deploy:** git commit + push → Railway actualiza solo.

**Contrato acordado del login (para que front y back coincidan):**
`{ id, nombre, idAlmacen, idSucursal, idPuesto, token }`

## 5. Orden de despliegue (para NO tumbar la app en vivo)

Importante: si el backend **exige** token antes de que el front lo mande, la app en vivo
se rompería (todo daría 401). Hagan esto en orden:

1. **Front-end primero:** desplegar la versión token-aware (esta). Sigue funcionando
   contra la API abierta.
2. **Backend paso 1 (no rompe):** que `/login` **devuelva** token y activar `throttle`.
   La app empezará a recibir y mandar el token, pero los endpoints aún no lo exigen.
3. **Backend paso 2 (activar candado):** agregar `auth:sanctum` a las rutas. A partir de
   aquí solo pasan peticiones con token válido — y la app ya lo manda.

Resultado: transición sin caída del servicio.

## 6. Hoy mismo (protege el costo, sin código)

En **Railway** → Billing/Usage → **fijar un límite de gasto (spending limit) y alertas de
uso**. No frena el abuso, pero pone un tope para que no haya cobros sorpresa mientras se
implementa el token.

## 7. Cómo actualizar la app (recordatorio de deploy)

```bash
npm run build
git add -A
git commit -m "..."
git push
```
Luego en cPanel → Git Version Control → **Update from Remote** → **Deploy HEAD Commit**.
