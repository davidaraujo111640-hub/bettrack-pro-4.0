import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Importante: no expongas claves de API aquí. Todo lo que se define en el
// frontend acaba visible en el navegador. Las claves viven solo en el servidor.
export default defineConfig({
  plugins: [
    react(),
    // App instalable (PWA): el service worker guarda la app en el dispositivo para que
    // se abra al instante y funcione sin conexión. Las apuestas no se tocan: siguen en
    // el almacenamiento del navegador.
    VitePWA({
      // Al publicar una versión nueva no se recarga sola: la app muestra un aviso para actualizar
      registerType: 'prompt',
      // Se usa public/manifest.json tal cual
      manifest: false,
      workbox: {
        // Pantallas, estilos, iconos, logos de las casas e iconos de deportes
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Cualquier ruta abre la app (sin conexión también), salvo la API
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Tipografías de Google Fonts: se guardan la primera vez que se usan
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
