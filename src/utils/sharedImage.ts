/**
 * Traspaso de la imagen compartida desde otra app (menú Compartir de Android).
 *
 * El service worker recibe la imagen y la deja en esta caché; la app, al arrancar y tener
 * la sesión lista, la recoge de aquí y abre el formulario de nueva apuesta con ella.
 */
export const SHARE_CACHE = 'bt-share';
export const SHARE_IMAGE_KEY = '/__shared/image';

/** Subconjunto de CacheStorage que se usa (así se puede probar sin navegador) */
export interface CacheStorageLike {
  open(name: string): Promise<{
    match(key: string): Promise<Response | undefined>;
    delete(key: string): Promise<boolean>;
  }>;
}

/** Devuelve la imagen compartida pendiente (si hay) y la borra para no abrirla dos veces */
export async function takeSharedImage(storage: CacheStorageLike): Promise<File | null> {
  try {
    const cache = await storage.open(SHARE_CACHE);
    const response = await cache.match(SHARE_IMAGE_KEY);
    if (!response) return null;
    await cache.delete(SHARE_IMAGE_KEY);
    const blob = await response.blob();
    if (!blob.type.startsWith('image/') || blob.size === 0) return null;
    const name = response.headers.get('x-file-name') || 'apuesta-compartida';
    return new File([blob], name, { type: blob.type });
  } catch {
    return null;
  }
}
