import { describe, expect, it } from 'vitest';
import { BetStatus, type Bet } from '../../types';
import { applyRemote, diffSnapshot, mergeQueue, rowsToData, stableStringify, toSnapshot, type CloudData } from './cloudSync';

const bet = (id: string, extra: Partial<Bet> = {}): Bet => ({
  id, bankrollId: 'default', date: '2026-10-01', bookmaker: 'Bet365', sport: 'Fútbol',
  odds: 2, stake: 10, status: BetStatus.PENDING, profit: 0, description: 'x', ...extra,
});
const data = (bets: Bet[]): CloudData => ({ bets, bankrolls: [{ id: 'default', name: 'B', initialCapital: 100, color: '#000' }], bookmakers: [] });

describe('stableStringify', () => {
  it('no depende del orden de las claves ni de los undefined', () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(stableStringify({ a: { c: 3, d: 2 }, b: 1, z: undefined }));
  });
});

describe('diffSnapshot', () => {
  it('con la foto vacía lo sube todo', () => {
    const { ops } = diffSnapshot({}, data([bet('1'), bet('2')]));
    expect(ops.map(o => `${o.type}:${o.kind}:${o.id}`)).toEqual(['upsert:bet:1', 'upsert:bet:2', 'upsert:bankroll:default']);
  });

  it('solo envía lo que ha cambiado y lo borrado', () => {
    const before = data([bet('1'), bet('2'), bet('3')]);
    const after = data([bet('1'), bet('2', { status: BetStatus.WON, profit: 10 })]);
    const { ops, snapshot } = diffSnapshot(toSnapshot(before), after);
    expect(ops).toEqual([
      { type: 'upsert', kind: 'bet', id: '2', data: JSON.parse(stableStringify(after.bets[1])) },
      { type: 'delete', kind: 'bet', id: '3' },
    ]);
    expect(diffSnapshot(snapshot, after).ops).toEqual([]);
  });

  it('un objeto igual que vuelve de la nube con otro orden no genera cambios', () => {
    const d = data([bet('1')]);
    const reordered = { ...d, bets: [Object.fromEntries(Object.entries(d.bets[0]).reverse()) as unknown as Bet] };
    expect(diffSnapshot(toSnapshot(d), reordered).ops).toEqual([]);
  });
});

describe('mergeQueue', () => {
  it('deja solo la última operación de cada elemento', () => {
    const q = mergeQueue(
      [{ type: 'upsert', kind: 'bet', id: '1', data: 1 }, { type: 'upsert', kind: 'bet', id: '2', data: 2 }],
      [{ type: 'delete', kind: 'bet', id: '1' }],
    );
    expect(q).toEqual([{ type: 'upsert', kind: 'bet', id: '2', data: 2 }, { type: 'delete', kind: 'bet', id: '1' }]);
  });
});

describe('rowsToData', () => {
  it('reparte las filas por tipo y ordena las apuestas de más reciente a más antigua', () => {
    const d = rowsToData([
      { kind: 'bet', id: 'a', data: bet('a', { date: '2026-01-01' }) },
      { kind: 'bankroll', id: 'default', data: { id: 'default' } },
      { kind: 'bet', id: 'b', data: bet('b', { date: '2026-05-01' }) },
    ]);
    expect(d.bets.map(b => b.id)).toEqual(['b', 'a']);
    expect(d.bankrolls).toHaveLength(1);
  });
});

describe('applyRemote', () => {
  it('añade, reemplaza y borra', () => {
    const list = [{ id: '1', v: 1 }];
    expect(applyRemote(list, '2', { id: '2', v: 2 })).toEqual([{ id: '2', v: 2 }, { id: '1', v: 1 }]);
    expect(applyRemote(list, '1', { id: '1', v: 9 })).toEqual([{ id: '1', v: 9 }]);
    expect(applyRemote(list, '1', null)).toEqual([]);
  });
});
