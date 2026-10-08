import { describe, expect, it, vi } from 'vitest';
import { loadSanitized, sanitizeBankroll, sanitizeBet, sanitizeBookmaker, sanitizeList } from './sanitize';

const bet = (over: Record<string, unknown> = {}) => ({
  id: 'a', bankrollId: 'b1', date: '2026-10-01', bookmaker: 'Bet365', sport: 'Fútbol',
  odds: 2, stake: 10, status: 'WON', profit: 10, description: 'x', ...over,
});

describe('sanitizeBet', () => {
  it('deja intacta una apuesta válida', () => {
    expect(sanitizeBet(bet())).toEqual(bet());
  });

  it('descarta lo que no tiene lo imprescindible', () => {
    expect(sanitizeBet(null)).toBeNull();
    expect(sanitizeBet('texto')).toBeNull();
    expect(sanitizeBet(bet({ id: undefined }))).toBeNull();
    expect(sanitizeBet(bet({ date: undefined }))).toBeNull();
    expect(sanitizeBet(bet({ date: 'ayer' }))).toBeNull();
    expect(sanitizeBet(bet({ odds: 'dos' }))).toBeNull();
    expect(sanitizeBet(bet({ odds: 0 }))).toBeNull();
    expect(sanitizeBet(bet({ stake: -5 }))).toBeNull();
    expect(sanitizeBet(bet({ profit: NaN }))).toBeNull();
    expect(sanitizeBet(bet({ status: 'RARO' }))).toBeNull();
  });

  it('rellena con valores por defecto lo secundario', () => {
    const r = sanitizeBet(bet({ bankrollId: undefined, bookmaker: undefined, sport: undefined, description: undefined }));
    expect(r).toMatchObject({ bankrollId: 'default', bookmaker: '', sport: 'Otros', description: '' });
  });

  it('acepta fechas con hora y se queda con el día', () => {
    expect(sanitizeBet(bet({ date: '2026-10-01T22:30:00.000Z' }))!.date).toBe('2026-10-01');
  });

  it('conserva la marca de freebet y las selecciones válidas', () => {
    const legs = [{ description: 'A', odds: 1.5, status: 'WON' }, { description: 'B', odds: 2, status: 'PENDING' }];
    expect(sanitizeBet(bet({ freebet: true, legs }))).toMatchObject({ freebet: true, legs });
  });

  it('si las selecciones están dañadas, conserva la apuesta sin ellas', () => {
    const r = sanitizeBet(bet({ legs: [{ description: 'A', odds: 'x', status: 'WON' }, { odds: 2 }] }));
    expect(r).not.toBeNull();
    expect(r!.legs).toBeUndefined();
  });

  it('no arrastra campos desconocidos', () => {
    expect(sanitizeBet(bet({ intruso: '<script>' }))).not.toHaveProperty('intruso');
  });
});

describe('sanitizeBankroll y sanitizeBookmaker', () => {
  it('bankroll: exige id y arregla el resto', () => {
    expect(sanitizeBankroll({ name: 'sin id' })).toBeNull();
    expect(sanitizeBankroll({ id: 'x' })).toEqual({ id: 'x', name: 'Bankroll', initialCapital: 0, color: '#e2001a' });
    expect(sanitizeBankroll({ id: 'x', name: 'P', initialCapital: 'mil', archived: true, createdAt: 5 }))
      .toEqual({ id: 'x', name: 'P', initialCapital: 0, color: '#e2001a', archived: true, createdAt: 5 });
  });

  it('casa: exige id y nombre', () => {
    expect(sanitizeBookmaker({ id: 'a' })).toBeNull();
    expect(sanitizeBookmaker({ id: 'a', name: '  ' })).toBeNull();
    expect(sanitizeBookmaker({ id: 'a', name: 'Bet365' })).toEqual({ id: 'a', name: 'Bet365', icon: '', enabled: true });
    expect(sanitizeBookmaker({ id: 'a', name: 'Bet365', icon: 'x', enabled: false })!.enabled).toBe(false);
  });
});

describe('sanitizeList / loadSanitized', () => {
  it('separa lo válido de lo dañado', () => {
    const { items, dropped } = sanitizeList([bet(), { id: 'roto' }, 5], sanitizeBet);
    expect(items).toHaveLength(1);
    expect(dropped).toHaveLength(2);
  });

  it('una entrada que no es lista da lista vacía', () => {
    expect(sanitizeList({ no: 'lista' }, sanitizeBet)).toEqual({ items: [], dropped: [] });
  });

  it('loadSanitized tolera JSON roto y vacío', () => {
    expect(loadSanitized(null, sanitizeBet)).toEqual([]);
    expect(loadSanitized('{no es json', sanitizeBet)).toEqual([]);
  });

  it('loadSanitized aparta lo descartado en vez de perderlo', () => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', { setItem: (k: string, v: string) => { store[k] = v; }, getItem: (k: string) => store[k] ?? null });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = loadSanitized(JSON.stringify([bet(), { id: 'roto', odds: 3 }]), sanitizeBet);
    expect(items).toHaveLength(1);
    expect(JSON.parse(store['bt_dropped_items'])).toEqual([{ id: 'roto', odds: 3 }]);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
