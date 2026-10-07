/**
 * Cómo se puede instalar la app en este dispositivo:
 * - 'installed': ya está instalada (abierta como app), no hay nada que mostrar.
 * - 'ios': iPhone/iPad. Apple no deja un botón automático: hay que guiar los pasos en Safari.
 * - 'prompt': el navegador ofrece instalar con un clic (Chrome/Edge). Solo se sabe cuando
 *   salta el evento beforeinstallprompt, que se gestiona aparte.
 */
export type InstallKind = 'installed' | 'ios' | 'other';

export interface InstallEnv {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  /** display-mode: standalone, o navigator.standalone en iOS */
  standalone: boolean;
}

export function detectInstallKind(env: InstallEnv): InstallKind {
  if (env.standalone) return 'installed';
  const iPhoneOrPod = /iPhone|iPod/.test(env.userAgent);
  // Los iPad modernos se identifican como Mac, pero tienen pantalla táctil
  const iPad = /iPad/.test(env.userAgent) || (env.platform === 'MacIntel' && env.maxTouchPoints > 1);
  return iPhoneOrPod || iPad ? 'ios' : 'other';
}
