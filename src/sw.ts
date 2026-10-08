// Service worker de BetTrack (lo compila vite-plugin-pwa; no se incluye en la comprobación de tipos de la app).
// Hace lo mismo que el generado automáticamente antes —guardar la app para usarla sin conexión y
// avisar de versiones nuevas— y añade la recepción de imágenes desde el menú Compartir de Android.
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { SHARE_CACHE, SHARE_IMAGE_KEY } from './utils/sharedImage';

// Tipado mínimo del contexto del service worker (el proyecto compila con la librería DOM, no con WebWorker)
interface WorkerScope {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
  addEventListener(type: 'message', listener: (event: { data?: { type?: string } }) => void): void;
  addEventListener(type: 'fetch', listener: (event: { request: Request; respondWith(r: Promise<Response>): void }) => void): void;
  skipWaiting(): Promise<void>;
  location: { origin: string };
}
// Workbox sustituye el texto literal self.__WB_MANIFEST por la lista de archivos de la app
declare const self: WorkerScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cualquier ruta abre la app, también sin conexión (salvo la API)
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//, /^\/share-target/] }));

// Tipografías de Google Fonts: se guardan la primera vez que se usan
registerRoute(
  ({ url }) => /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname),
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// Con registerType "prompt": la app pide activar la versión nueva cuando el usuario pulsa "Actualizar"
self.addEventListener('message', (event: { data?: { type?: string } }) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Compartir desde otra app (Android): la imagen llega por POST a /share-target. Se guarda en una caché
// y se abre la app, que la recoge al arrancar. Sin imagen (solo texto o enlace) se avisa en la app.
self.addEventListener('fetch', (event: { request: Request; respondWith(r: Promise<Response>): void }) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.origin !== self.location.origin || url.pathname !== '/share-target') return;

  event.respondWith((async () => {
    try {
      const form = await event.request.formData();
      const file = form.get('image');
      if (file instanceof File && file.type.startsWith('image/') && file.size > 0) {
        const cache = await caches.open(SHARE_CACHE);
        await cache.put(SHARE_IMAGE_KEY, new Response(file, { headers: { 'Content-Type': file.type, 'x-file-name': file.name || '' } }));
        return Response.redirect('/?share=image', 303);
      }
    } catch (e) {
      console.warn('share-target: no se pudo leer lo compartido', e);
    }
    return Response.redirect('/?share=other', 303);
  })());
});
