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
      // Service worker propio (src/sw.ts): además de guardar la app para usarla sin conexión,
      // recibe las imágenes compartidas desde otras apps (menú Compartir de Android)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // Pantallas, estilos, iconos, logos de las casas e iconos de deportes
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
