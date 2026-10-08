/** Lado más largo al que se reduce una captura antes de mandarla a la IA: se lee igual de bien y pesa mucho menos */
export const MAX_IMAGE_SIDE = 1600;

/** Tamaño reducido manteniendo la proporción; no agranda las imágenes pequeñas */
export function fitSize(width: number, height: number, max = MAX_IMAGE_SIDE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * Prepara una imagen para analizarla: la reduce y la pasa a JPEG, que casi siempre cabe en el
 * límite de 4 MB de la petición (las fotos y capturas del móvil pueden pesar bastante más).
 * Si el navegador no puede procesarla, se envía tal cual.
 */
export async function prepareImage(file: Blob): Promise<{ base64: string; mimeType: string }> {
  const original = () => readAsBase64(file).then(base64 => ({ base64, mimeType: file.type || 'image/png' }));
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original();
    // Fondo blanco: los PNG con transparencia no se vuelven negros al pasar a JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
  } catch {
    return original();
  }
}

function readAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Lado más largo de los iconos de casas subidos por el usuario (se muestran a unos 40 px) */
export const MAX_ICON_SIDE = 192;
/** Peso máximo del archivo que se acepta como icono, antes de reducirlo */
export const MAX_ICON_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Reduce una imagen subida como icono y la devuelve como dato PNG (conserva la transparencia).
 * Sin esto, una foto de varios MB acabaría en el almacenamiento del dispositivo y en la nube.
 * Lanza un error con un mensaje para el usuario si el archivo no vale.
 */
export async function resizeToIconDataUrl(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.');
  if (file.size > MAX_ICON_FILE_BYTES) throw new Error('La imagen pesa demasiado (máximo 8 MB).');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('No se ha podido leer la imagen. Prueba con otra (PNG, JPG o WEBP).');
  }
  const { width, height } = fitSize(bitmap.width, bitmap.height, MAX_ICON_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se ha podido procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL('image/png');
}
