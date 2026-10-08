import { describe, expect, it } from 'vitest';
import { SHARE_CACHE, SHARE_IMAGE_KEY, takeSharedImage, type CacheStorageLike } from './sharedImage';

/** CacheStorage mínimo en memoria */
function fakeStorage(initial: Record<string, Response> = {}) {
  const store = new Map(Object.entries(initial));
  const opened: string[] = [];
  const storage: CacheStorageLike = {
    async open(name) {
      opened.push(name);
      return {
        async match(key) { return store.get(key); },
        async delete(key) { return store.delete(key); },
      };
    },
  };
  return { storage, store, opened };
}

const image = (type = 'image/png', body = 'datos', name = 'captura.png') =>
  new Response(body, { headers: { 'Content-Type': type, 'x-file-name': name } });

describe('takeSharedImage', () => {
  it('devuelve la imagen compartida como archivo y la borra para no abrirla dos veces', async () => {
    const { storage, store, opened } = fakeStorage({ [SHARE_IMAGE_KEY]: image() });
    const file = await takeSharedImage(storage);
    expect(file).not.toBeNull();
    expect(file!.type).toBe('image/png');
    expect(file!.name).toBe('captura.png');
    expect(file!.size).toBe(5);
    expect(opened).toEqual([SHARE_CACHE]);
    expect(store.has(SHARE_IMAGE_KEY)).toBe(false);
    expect(await takeSharedImage(storage)).toBeNull();
  });

  it('devuelve null si no hay nada compartido', async () => {
    expect(await takeSharedImage(fakeStorage().storage)).toBeNull();
  });

  it('ignora lo que no es una imagen', async () => {
    const { storage } = fakeStorage({ [SHARE_IMAGE_KEY]: image('text/plain') });
    expect(await takeSharedImage(storage)).toBeNull();
  });

  it('ignora un archivo vacío', async () => {
    const { storage } = fakeStorage({ [SHARE_IMAGE_KEY]: image('image/png', '') });
    expect(await takeSharedImage(storage)).toBeNull();
  });

  it('no falla si la caché no está disponible', async () => {
    const broken: CacheStorageLike = { open: async () => { throw new Error('sin caché'); } };
    expect(await takeSharedImage(broken)).toBeNull();
  });
});
