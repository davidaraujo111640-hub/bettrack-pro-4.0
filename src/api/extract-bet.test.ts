import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler, { bearerToken, verifyUser } from '../../api/extract-bet';

const okUser = (id = 'user-1') => vi.fn(async () => new Response(JSON.stringify({ id }), { status: 200 }));

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://proyecto.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
});
afterEach(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  vi.unstubAllGlobals();
});

function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) { res.statusCode = code; return res; },
    json(payload: unknown) { res.body = payload; return res; },
    setHeader(name: string, value: string) { res.headers[name] = value; },
  };
  return res;
}
const call = async (req: Record<string, unknown>) => {
  const res = fakeRes();
  await handler(req as never, res as never);
  return res;
};

describe('bearerToken', () => {
  it('lee el token de la cabecera', () => {
    expect(bearerToken('Bearer abc.def')).toBe('abc.def');
    expect(bearerToken('bearer abc')).toBe('abc');
    expect(bearerToken(['Bearer xyz'])).toBe('xyz');
  });
  it('ignora cabeceras vacías o raras', () => {
    expect(bearerToken(undefined)).toBeNull();
    expect(bearerToken('')).toBeNull();
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken('Bearer')).toBeNull();
  });
});

describe('verifyUser', () => {
  it('devuelve el usuario cuando Supabase acepta el token y lo recuerda un rato', async () => {
    const fetchMock = okUser('u-42');
    expect(await verifyUser('token-bueno', fetchMock as never)).toBe('u-42');
    expect(await verifyUser('token-bueno', fetchMock as never)).toBe('u-42');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toBe('https://proyecto.supabase.co/auth/v1/user');
    expect(init.headers.Authorization).toBe('Bearer token-bueno');
    expect(init.headers.apikey).toBe('sb_publishable_test');
  });

  it('devuelve null si Supabase rechaza el token', async () => {
    const rechazo = vi.fn(async () => new Response('{}', { status: 401 }));
    expect(await verifyUser('token-malo', rechazo as never)).toBeNull();
  });

  it('devuelve null si la respuesta no trae usuario', async () => {
    const sinId = vi.fn(async () => new Response('{}', { status: 200 }));
    expect(await verifyUser('token-sin-id', sinId as never)).toBeNull();
  });

  it('acepta las variables con prefijo VITE_ (como están en Vercel)', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.VITE_SUPABASE_URL = 'https://otro.supabase.co';
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vite';
    const fetchMock = okUser();
    await verifyUser('token-vite', fetchMock as never);
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe('https://otro.supabase.co/auth/v1/user');
  });

  it('falla si el servidor no tiene las claves de Supabase', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    await expect(verifyUser('x', okUser() as never)).rejects.toThrow();
  });
});

describe('POST /api/extract-bet', () => {
  it('sin sesión devuelve 401 y no llega a usar la IA', async () => {
    const res = await call({ method: 'POST', headers: {}, body: { imageData: 'AAAA' } });
    expect(res.statusCode).toBe(401);
    expect(String((res.body as { error: string }).error)).toMatch(/Inicia sesión/);
  });

  it('con un token que Supabase rechaza devuelve 401', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    const res = await call({ method: 'POST', headers: { authorization: 'Bearer caducado' }, body: { imageData: 'AAAA' } });
    expect(res.statusCode).toBe(401);
    expect(String((res.body as { error: string }).error)).toMatch(/caducado/);
  });

  it('sin claves de Supabase en el servidor devuelve 503', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    const res = await call({ method: 'POST', headers: { authorization: 'Bearer lo-que-sea' }, body: { imageData: 'AAAA' } });
    expect(res.statusCode).toBe(503);
  });

  it('con sesión válida pero sin imagen devuelve 400', async () => {
    vi.stubGlobal('fetch', okUser('u-sin-imagen'));
    const res = await call({ method: 'POST', headers: { authorization: 'Bearer valido-1' }, body: {} });
    expect(res.statusCode).toBe(400);
  });

  it('solo acepta POST', async () => {
    const res = await call({ method: 'GET', headers: {} });
    expect(res.statusCode).toBe(405);
  });

  it('limita el uso por usuario', async () => {
    vi.stubGlobal('fetch', okUser('u-abusón'));
    const req = { method: 'POST', headers: { authorization: 'Bearer valido-2' }, body: {} };
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await call(req)).statusCode;
    expect(last).toBe(429);
  });
});
