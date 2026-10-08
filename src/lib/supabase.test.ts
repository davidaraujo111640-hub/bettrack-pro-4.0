import { describe, expect, it, vi } from 'vitest';
import { authErrorMessage, isInviteHash, isSignupOpen } from './supabase';

describe('authErrorMessage', () => {
  it('traduce el cierre del registro', () => {
    expect(authErrorMessage({ code: 'signup_disabled', message: 'Signups not allowed for this instance' })).toMatch(/registro está cerrado/i);
    expect(authErrorMessage({ message: 'Signups not allowed for this instance' })).toMatch(/solo por invitación/i);
  });

  it('mantiene el resto de traducciones', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toMatch(/incorrectos/);
    expect(authErrorMessage({ message: 'Failed to fetch' })).toMatch(/Sin conexión/);
    expect(authErrorMessage(null)).toMatch(/error/i);
  });
});

describe('isSignupOpen', () => {
  const config = { url: 'https://proyecto.supabase.co', key: 'sb_publishable_test' };
  const settings = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it('es falso solo cuando Supabase dice que el registro está cerrado', async () => {
    const fetchImpl = settings({ disable_signup: true });
    expect(await isSignupOpen({ ...config, fetchImpl: fetchImpl as never })).toBe(false);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe('https://proyecto.supabase.co/auth/v1/settings');
    expect(init.headers.apikey).toBe('sb_publishable_test');
  });

  it('es verdadero si el registro está abierto', async () => {
    expect(await isSignupOpen({ ...config, fetchImpl: settings({ disable_signup: false }) as never })).toBe(true);
    expect(await isSignupOpen({ ...config, fetchImpl: settings({}) as never })).toBe(true);
  });

  it('ante cualquier fallo, se ofrece el registro en vez de esconderlo por error', async () => {
    expect(await isSignupOpen({ ...config, fetchImpl: settings({}, 500) as never })).toBe(true);
    expect(await isSignupOpen({ ...config, fetchImpl: vi.fn(async () => { throw new Error('sin red'); }) as never })).toBe(true);
    expect(await isSignupOpen({ fetchImpl: settings({ disable_signup: true }) as never, url: '', key: '' })).toBe(true);
  });
});

describe('isInviteHash', () => {
  it('reconoce el enlace de una invitación', () => {
    expect(isInviteHash('#access_token=abc&expires_in=3600&refresh_token=x&token_type=bearer&type=invite')).toBe(true);
    expect(isInviteHash('#type=invite&access_token=abc')).toBe(true);
  });

  it('no confunde otros enlaces', () => {
    expect(isInviteHash('#access_token=abc&type=recovery')).toBe(false);
    expect(isInviteHash('#access_token=abc&type=signup')).toBe(false);
    expect(isInviteHash('#/bets')).toBe(false);
    expect(isInviteHash('')).toBe(false);
  });
});
