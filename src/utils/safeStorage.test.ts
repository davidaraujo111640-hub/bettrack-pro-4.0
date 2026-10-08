import { describe, expect, it, vi } from 'vitest';
import { safeSetItem, STORAGE_ERROR_EVENT } from './safeStorage';

describe('safeSetItem', () => {
  it('guarda y devuelve true', () => {
    const store: Record<string, string> = {};
    expect(safeSetItem('k', 'v', { setItem: (k, v) => { store[k] = v; } })).toBe(true);
    expect(store).toEqual({ k: 'v' });
  });

  it('no lanza si el almacenamiento está lleno: devuelve false y avisa', () => {
    const listener = vi.fn();
    const target = new EventTarget();
    vi.stubGlobal('window', Object.assign(target, { dispatchEvent: target.dispatchEvent.bind(target) }));
    target.addEventListener(STORAGE_ERROR_EVENT, listener);
    const full = { setItem: () => { throw new DOMException('QuotaExceededError'); } };
    expect(safeSetItem('bet_track_bets', 'x', full)).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});
