/// <reference types="vite/client" />
import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../../types';

// La URL y la clave "publishable" son públicas por diseño: lo que protege los datos
// son las reglas por usuario (RLS) de la base de datos. Nunca pongas aquí la clave secreta.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (ver .env.example)');
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
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
  if (code === 'weak_password' || m.includes('password should')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (code === 'same_password') return 'La nueva contraseña debe ser distinta de la actual.';
  if (code === 'over_email_send_rate_limit' || m.includes('rate limit')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sin conexión con el servidor. Revisa tu internet.';
  return err?.message || 'Ha ocurrido un error. Inténtalo de nuevo.';
}
