/// <reference types="vite/client" />
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../../types';

// La URL y la clave "publishable" son públicas por diseño: lo que protege los datos
// son las reglas por usuario (RLS) de la base de datos. Nunca pongas aquí la clave secreta.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** false si esta versión se construyó sin las claves de Supabase (variables de entorno sin configurar) */
export const supabaseConfigured = Boolean(url && key);

if (!supabaseConfigured) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example)');
}

/** El enlace de una invitación lleva "type=invite" en la dirección. */
export function isInviteHash(hash: string): boolean {
  return /(^|[#&?])type=invite(&|$)/.test(hash);
}

// Se mira antes de crear el cliente, que borra de la dirección los datos de la sesión al leerlos
const openedFromInviteLink = typeof window !== 'undefined' && isInviteHash(window.location.hash);
/** Esta visita viene de abrir el enlace de invitación del email: hay que pedir al usuario que cree su contraseña. */
export const openedFromInvite = openedFromInviteLink;

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Convierte el usuario de Supabase al usuario de la app */
export function toAppUser(u: SupabaseUser): User {
  const meta = (u.user_metadata ?? {}) as { name?: string; full_name?: string };
  return {
    id: u.id,
    email: u.email ?? '',
    name: meta.name || meta.full_name || (u.email ?? '').split('@')[0],
    // De momento todas las cuentas son PRO, como antes
    plan: 'PRO',
  };
}

/** Traduce los errores de Supabase a mensajes en español */
export function authErrorMessage(err: { message?: string; code?: string } | null | undefined): string {
  const m = (err?.message ?? '').toLowerCase();
  const code = err?.code ?? '';
  if (code === 'invalid_credentials' || m.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (code === 'email_not_confirmed' || m.includes('not confirmed')) return 'Confirma tu email antes de entrar (revisa tu correo).';
  if (code === 'user_already_exists' || m.includes('already registered')) return 'Este email ya está registrado.';
  if (code === 'signup_disabled' || m.includes('signups not allowed') || m.includes('signup is disabled')) return 'El registro está cerrado: el acceso es solo por invitación.';
  if (code === 'weak_password' || m.includes('password should')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code === 'same_password') return 'La nueva contraseña debe ser distinta de la actual.';
  if (code === 'over_email_send_rate_limit' || m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sin conexión con el servidor. Revisa tu internet.';
  return err?.message || 'Ha ocurrido un error. Inténtalo de nuevo.';
}

/**
 * Pregunta a Supabase si se pueden crear cuentas nuevas (el registro se abre y cierra en su panel).
 * Si no se puede comprobar, se da por abierto: es mejor ofrecer la opción que esconderla por error.
 */
export async function isSignupOpen(options: { fetchImpl?: typeof fetch; url?: string; key?: string } = {}): Promise<boolean> {
  const { fetchImpl = fetch, url: baseUrl = url, key: apiKey = key } = options;
  if (!baseUrl || !apiKey) return true;
  try {
    const response = await fetchImpl(`${baseUrl}/auth/v1/settings`, { headers: { apikey: apiKey } });
    if (!response.ok) return true;
    const settings = (await response.json()) as { disable_signup?: unknown };
    return settings.disable_signup !== true;
  } catch {
    return true;
  }
}
