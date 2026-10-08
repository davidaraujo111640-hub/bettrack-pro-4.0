/** Evento que se lanza cuando no se ha podido guardar nada en el dispositivo (por ejemplo, almacenamiento lleno) */
export const STORAGE_ERROR_EVENT = 'bt-storage-error';

/**
 * localStorage.setItem que no rompe la app si falla (almacenamiento lleno, modo privado, datos bloqueados).
 * Devuelve false si no se pudo guardar y avisa con un evento para mostrar un aviso al usuario.
 */
export function safeSetItem(key: string, value: string, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }));
    return false;
  }
}
