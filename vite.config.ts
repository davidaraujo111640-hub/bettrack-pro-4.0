import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Versión de la app (package.json), fecha de publicación y código del cambio (Vercel o Git)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };
function gitCommit(): string {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return fromVercel.slice(0, 7);
  try { return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().slice(0, 7); } catch { return 'dev'; }
}

// Importante: no expongas claves de API aquí. Todo lo que se define en el
// frontend acaba visible en el navegador. Las claves viven solo en el servidor.
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Las librerías grandes van en archivos propios: al publicar una versión nueva solo cambia el código de la app
        // y los móviles descargan unos pocos KB en vez de todo otra vez (el navegador conserva el resto en caché).
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __APP_COMMIT__: JSON.stringify(gitCommit()),
  },
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
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,ico,json,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
