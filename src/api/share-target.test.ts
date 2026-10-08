import { describe, expect, it } from 'vitest';
import handler from '../../api/share-target';

describe('POST /share-target (sin service worker activo)', () => {
  it('redirige a la app con un aviso en vez de dar error', () => {
    const headers: Record<string, string> = {};
    let status = 0;
    let ended = false;
    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v; },
      status(code: number) { status = code; return res; },
      end() { ended = true; },
    };
    handler({} as never, res as never);
    expect(status).toBe(303);
    expect(headers.Location).toBe('/?share=other');
    expect(ended).toBe(true);
  });
});
