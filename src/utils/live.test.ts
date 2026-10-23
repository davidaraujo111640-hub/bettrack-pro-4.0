import { describe, expect, it } from 'vitest';
import { Bet, BetStatus } from '../../types';
import { computeBetStats } from './betMath';
import { buildBackup, parseBackup } from './backup';
import { sanitizeBet } from './sanitize';
import { betsToCsv } from './exportCsv';

const bet = (id: string, status: BetStatus, profit: number, extra: Partial<Bet> = {}): Bet => ({
  id, bankrollId: 'b1', date: '2026-10-01', bookmaker: 'Bet365', sport: 'Fútbol',
  odds: 2, stake: 10, status, profit, description: `Apuesta ${id}`, ...extra,
});

const bets = [
  bet('p1', BetStatus.WON, 10),
  bet('p2', BetStatus.LOST, -10),
  bet('l1', BetStatus.WON, 20, { live: true, odds: 3 }),
  bet('l2', BetStatus.LOST, -10, { live: true }),
  bet('l3', BetStatus.LOST, -10, { live: true }),
  bet('l4', BetStatus.PENDING, 0, { live: true }),
];

describe('estadísticas: Prepartido vs Live', () => {
  const s = computeBetStats(bets, 1000);
  const pre = s.byMode.find(r => r.key === 'Prepartido')!;
  const live = s.byMode.find(r => r.key === 'Live')!;

  it('cuenta las apuestas live', () => {
    expect(s.live).toBe(4);
    expect(live.bets).toBe(4);
    expect(pre.bets).toBe(2);
  });

  it('calcula por separado beneficio, acierto y yield', () => {
    expect(live).toMatchObject({ won: 1, lost: 2, staked: 30, profit: 0 });
    expect(live.winRate).toBeCloseTo(33.33, 1);
    expect(pre).toMatchObject({ won: 1, lost: 1, staked: 20, profit: 0 });
    expect(pre.winRate).toBe(50);
  });

  it('el beneficio total sigue siendo la suma de las dos modalidades', () => {
    expect(s.profit).toBe(pre.profit + live.profit);
  });

  it('muestra siempre las dos filas, aunque no haya ninguna live', () => {
    const sinLive = computeBetStats([bet('a', BetStatus.WON, 10)], 1000);
    expect(sinLive.byMode.map(r => r.key)).toEqual(['Prepartido', 'Live']);
    expect(sinLive.byMode[1]).toMatchObject({ bets: 0, profit: 0, winRate: 0 });
    expect(sinLive.live).toBe(0);
  });

  it('las dos filas salen en este orden aunque las live sean mayoría', () => {
    expect(s.byMode.map(r => r.key)).toEqual(['Prepartido', 'Live']);
  });
});

describe('la marca live se conserva', () => {
  it('en la copia de seguridad', () => {
    const backup = buildBackup({ bets, bankrolls: [{ id: 'b1', name: 'P', initialCapital: 100, color: '#000' }], bookmakers: [] });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.bets.filter(b => b.live).map(b => b.id)).toEqual(['l1', 'l2', 'l3', 'l4']);
      expect(parsed.data.bets.find(b => b.id === 'p1')!.live).toBeUndefined();
    }
  });

  it('al limpiar datos dañados', () => {
    expect(sanitizeBet(bet('x', BetStatus.WON, 5, { live: true }))!.live).toBe(true);
    expect(sanitizeBet(bet('x', BetStatus.WON, 5))!.live).toBeUndefined();
    expect(sanitizeBet({ ...bet('x', BetStatus.WON, 5), live: 'sí' })!.live).toBeUndefined();
  });

  it('en la exportación a CSV', () => {
    const csv = betsToCsv([bet('a', BetStatus.WON, 10, { live: true }), bet('b', BetStatus.WON, 10)], [{ id: 'b1', name: 'P', initialCapital: 1, color: '#000' }]).split('\r\n');
    const col = csv[0].split(';').indexOf('Live');
    expect(col).toBeGreaterThan(-1);
    expect(csv[1].split(';')[col]).toBe('Sí');
    expect(csv[2].split(';')[col]).toBe('No');
  });
});
