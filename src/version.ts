/// <reference types="vite/client" />

// Estos valores los fija vite.config.ts al construir la app (ver "define"):
// la versión sale de package.json y el código del cambio, de Git (o de Vercel).
declare const __APP_VERSION__: string;
declare const __APP_BUILD_DATE__: string;
declare const __APP_COMMIT__: string;

export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
export const APP_BUILD_DATE: string = typeof __APP_BUILD_DATE__ === 'string' ? __APP_BUILD_DATE__ : '';
export const APP_COMMIT: string = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'dev';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "8 oct 2026" a partir de una fecha ISO; vacío si no es válida */
export function formatBuildDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Texto corto para la pantalla de acceso: "v1.0.0" */
export function shortVersion(version = APP_VERSION): string {
  return `v${version}`;
}

/** Texto completo para Mi perfil: "v1.0.0 · 8 oct 2026 · fc361a3" */
export function fullVersion(version = APP_VERSION, buildDate = APP_BUILD_DATE, commit = APP_COMMIT): string {
  return [shortVersion(version), formatBuildDate(buildDate), commit].filter(Boolean).join(' · ');
}
