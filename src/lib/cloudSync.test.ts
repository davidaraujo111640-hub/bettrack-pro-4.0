import { describe, expect, it, vi } from 'vitest';
import { BetStatus, type Bet } from '../../types';
import { applyRemote, diffSnapshot, mergeQueue, orderLike, planLoad, reconcileRemote, rowsToData, sortBankrolls, stableStringify, toSnapshot, type CloudData } from './cloudSync';

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

describe('planLoad', () => {
  it('ofrece subir las apuestas de antes si la nube no tiene ninguna', () => {
    expect(planLoad({ owner: null, localBets: 200, cloudBets: 0, cloudBankrolls: 0 })).toBe('migrate');
  });

  it('un bankroll vacío en la nube (cuenta abierta antes en otro navegador) no impide recuperarlas', () => {
    expect(planLoad({ owner: null, localBets: 200, cloudBets: 0, cloudBankrolls: 1 })).toBe('migrate');
  });

  it('si la nube ya tiene apuestas, manda la nube', () => {
    expect(planLoad({ owner: null, localBets: 200, cloudBets: 5, cloudBankrolls: 1 })).toBe('use-cloud');
  });

  it('cuenta sin ningún dato y sin apuestas locales empieza vacía', () => {
    expect(planLoad({ owner: null, localBets: 0, cloudBets: 0, cloudBankrolls: 0 })).toBe('start-empty');
  });

  it('si el navegador ya era de esta cuenta, no pregunta otra vez', () => {
    expect(planLoad({ owner: 'u1', localBets: 200, cloudBets: 0, cloudBankrolls: 1 })).toBe('use-cloud');
  });
});

describe('reconcileRemote', () => {
  const none = new Set<string>();
  const run = (local: CloudData, cloud: CloudData, pending = none, snapshot = toSnapshot(local)) =>
    reconcileRemote({ local, cloud, snapshot, pending });

  it('sin diferencias no cambia nada', () => {
    const d = data([bet('1'), bet('2')]);
    const r = run(d, structuredClone(d));
    expect(r.changed).toBe(false);
    expect(r.data.bets).toHaveLength(2);
  });

  it('trae los cambios hechos desde otro dispositivo (edición, alta y borrado)', () => {
    const local = data([bet('1'), bet('2'), bet('3')]);
    const cloud = data([bet('1', { status: BetStatus.WON, profit: 10 }), bet('3'), bet('4', { date: '2026-10-09' })]);
    const r = run(local, cloud);
    expect(r.changed).toBe(true);
    expect(r.data.bets.map(b => b.id).sort()).toEqual(['1', '3', '4']);
    expect(r.data.bets.find(b => b.id === '1')!.status).toBe(BetStatus.WON);
    expect(r.data.bets[0].id).toBe('4'); // la más reciente va primera
    expect(r.snapshot).toEqual(toSnapshot(r.data));
  });

  it('lo que tiene cambios propios pendientes de subir manda lo local', () => {
    const local = data([bet('1', { description: 'mi edición' })]);
    const cloud = data([bet('1', { description: 'versión vieja de la nube' })]);
    const r = run(local, cloud, new Set(['bet:1']));
    expect(r.data.bets[0].description).toBe('mi edición');
  });

  it('no resucita una apuesta que he borrado y aún no se ha subido el borrado', () => {
    const local = data([]);
    const cloud = data([bet('1')]);
    const r = run(local, cloud, new Set(['bet:1']), {});
    expect(r.data.bets).toHaveLength(0);
  });

  it('conserva una apuesta local nueva que aún no consta en la nube', () => {
    const local = data([bet('nueva')]);
    const r = run(local, data([]), none, {});
    expect(r.data.bets.map(b => b.id)).toEqual(['nueva']);
  });

  it('mantiene el orden local de los bankrolls y añade los nuevos al final', () => {
    const a = { id: 'a', name: 'A', initialCapital: 1, color: '#000' };
    const b = { id: 'b', name: 'B', initialCapital: 1, color: '#000' };
    const c = { id: 'c', name: 'C', initialCapital: 1, color: '#000' };
    const local: CloudData = { bets: [], bankrolls: [b, a], bookmakers: [] };
    const cloud: CloudData = { bets: [], bankrolls: [a, b, c], bookmakers: [] };
    expect(run(local, cloud).data.bankrolls.map(x => x.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('orderLike', () => {
  it('sigue el orden de la referencia y deja lo nuevo al final', () => {
    const item = (id: string) => ({ id });
    expect(orderLike([item('a'), item('b'), item('c')], [item('c'), item('a')]).map(x => x.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('rowsToData con datos dañados', () => {
  it('ignora lo dañado y conserva lo demás', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const d = rowsToData([
      { kind: 'bet', id: 'ok', data: bet('ok') },
      { kind: 'bet', id: 'roto', data: { id: 'roto', odds: 'x' } },
      { kind: 'bet', id: 'nulo', data: null },
      { kind: 'bankroll', id: 'sin-id', data: { name: 'sin id' } },
      { kind: 'bookmaker', id: 'b', data: { id: 'b', name: 'Bet365' } },
    ]);
    expect(d.bets.map(b => b.id)).toEqual(['ok']);
    expect(d.bankrolls).toHaveLength(0);
    expect(d.bookmakers).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('sortBankrolls', () => {
  const bank = (id: string, createdAt?: number) => ({ id, name: id, initialCapital: 1, color: '#000', ...(createdAt ? { createdAt } : {}) });

  it('los más antiguos primero; los anteriores a esta versión conservan su orden', () => {
    const cloud = [bank('nuevo', 300), bank('b'), bank('a'), bank('medio', 200)];
    const reference = [bank('a'), bank('b')];
    expect(sortBankrolls(cloud, reference).map(x => x.id)).toEqual(['a', 'b', 'medio', 'nuevo']);
  });

  it('es estable: el mismo resultado sin importar el orden de entrada', () => {
    const items = [bank('x', 5), bank('y', 5), bank('z', 5)];
    expect(sortBankrolls([...items].reverse(), []).map(b => b.id)).toEqual(sortBankrolls(items, []).map(b => b.id));
  });
});
