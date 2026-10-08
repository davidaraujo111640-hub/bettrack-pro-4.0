import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './id';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => vi.unstubAllGlobals());

describe('newId', () => {
  it('genera UUID v4 distintos', () => {
    const ids = new Set(Array.from({ length: 200 }, newId));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(UUID);
  });

  it('sigue funcionando sin crypto.randomUUID (contextos no seguros)', () => {
    vi.stubGlobal('crypto', { getRandomValues: (a: Uint8Array) => a.map(() => Math.floor(Math.random() * 256)) });
    expect(newId()).toMatch(UUID);
  });

  it('sigue funcionando sin crypto', () => {
    vi.stubGlobal('crypto', undefined);
    expect(newId()).toMatch(UUID);
  });
});
