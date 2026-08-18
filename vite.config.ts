import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

// PWA de inventario para telefonos (iOS + Android).
// La camara del navegador exige contexto seguro (HTTPS o localhost).
//   npm run dev        -> HTTP; usa http://localhost:5173 en la PC (webcam funciona)
//   npm run dev:https  -> HTTPS con certificado autofirmado (para probar en el celular por LAN)
export default defineConfig(({ mode }) => {
  const useHttps = mode === 'https'

  return {
    // Rutas relativas: la app funciona en cualquier subcarpeta de intranet
    // (p. ej. intranet.carnesbacal.com.mx/inventario/) sin recompilar por ruta.
    base: './',
    plugins: [
      react(),
      // Solo en modo https: sirve el dev server con certificado autofirmado.
      useHttps ? basicSsl() : undefined,
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Inventarios · Carnes Bacal',
          short_name: 'Inventarios',
          description: 'Conteos y traspasos de piso (Carnes Bacal)',
          theme_color: '#0a1c33',
          background_color: '#0a1c33',
          display: 'standalone',
          orientation: 'portrait',
          scope: './',
          start_url: './',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // No cacheamos las llamadas a /api (datos en vivo). Solo el shell de la app.
          navigateFallbackDenylist: [/^\/api/],
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // El .wasm del escaner (solo lo usa iOS) se cachea en la 1a carga, no se precachea.
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.endsWith('.wasm'),
              handler: 'CacheFirst',
              options: { cacheName: 'wasm-cache', expiration: { maxEntries: 4 } },
            },
          ],
        },
      }),
    ],
    server: {
      host: true,
      port: 5173,
      // Permite abrir el dev server a traves de un tunel (cloudflared/ngrok) para probar en el celular.
      allowedHosts: true,
    },
  }
})
