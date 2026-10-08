import { describe, expect, it } from 'vitest';
import { Bet, BetLeg, BetStatus } from '../../types';
import { applyLegs, comboOdds, defaultParlayDescription, deriveParlayStatus, isParlay, legsToText, resolveParlay, setLegStatus } from './parlay';
import { buildBackup, parseBackup } from './backup';

const legs = (...defs: [number, BetLeg['status']][]): BetLeg[] => defs.map(([odds, status], i) => ({ description: `Sel ${i + 1}`, odds, status }));

const parlay = (over: Partial<Bet> = {}): Bet => ({
  id: 'c1', bankrollId: 'b1', date: '2026-10-01', bookmaker: 'Winamax', sport: 'Fútbol',
  odds: 3.78, stake: 10, status: BetStatus.PENDING, profit: 0, description: 'Combi',
  legs: legs([1.8, 'PENDING'], [2.1, 'PENDING']), ...over,
});

describe('comboOdds', () => {
  it('multiplica las cuotas', () => {
    expect(comboOdds(legs([1.8, 'PENDING'], [2.1, 'WON']))).toBe(3.78);
    expect(comboOdds(legs([1.5, 'PENDING'], [2, 'PENDING'], [2, 'PENDING']))).toBe(6);
  });

  it('no cuenta las selecciones anuladas', () => {
    expect(comboOdds(legs([1.8, 'WON'], [2.1, 'VOID']))).toBe(1.8);
    expect(comboOdds(legs([1.8, 'VOID'], [2.1, 'VOID']))).toBe(1);
  });
});

describe('deriveParlayStatus', () => {
  it('pierde en cuanto una selección se pierde, aunque queden pendientes', () => {
    expect(deriveParlayStatus(legs([1.8, 'LOST'], [2, 'PENDING']))).toBe(BetStatus.LOST);
  });
  it('sigue pendiente mientras quede alguna sin resolver', () => {
    expect(deriveParlayStatus(legs([1.8, 'WON'], [2, 'PENDING']))).toBe(BetStatus.PENDING);
  });
  it('gana si todas están ganadas o anuladas', () => {
    expect(deriveParlayStatus(legs([1.8, 'WON'], [2, 'WON']))).toBe(BetStatus.WON);
    expect(deriveParlayStatus(legs([1.8, 'WON'], [2, 'VOID']))).toBe(BetStatus.WON);
  });
  it('se reembolsa si todas están anuladas', () => {
    expect(deriveParlayStatus(legs([1.8, 'VOID'], [2, 'VOID']))).toBe(BetStatus.REFUNDED);
  });
});

describe('applyLegs / setLegStatus', () => {
  it('ganar las dos selecciones da el beneficio de la cuota total', () => {
    let bet = setLegStatus(parlay(), 0, 'WON');
    expect(bet.status).toBe(BetStatus.PENDING);
    bet = setLegStatus(bet, 1, 'WON');
    expect(bet.status).toBe(BetStatus.WON);
    expect(bet.profit).toBe(27.8);
  });

  it('perder una selección pierde el importe', () => {
    const bet = setLegStatus(parlay(), 1, 'LOST');
    expect(bet.status).toBe(BetStatus.LOST);
    expect(bet.profit).toBe(-10);
  });

  it('anular una selección recalcula la cuota sin ella', () => {
    let bet = setLegStatus(parlay(), 1, 'VOID');
    bet = setLegStatus(bet, 0, 'WON');
    expect(bet.odds).toBe(1.8);
    expect(bet.status).toBe(BetStatus.WON);
    expect(bet.profit).toBe(8);
  });

  it('respeta una cuota potenciada mientras no haya selecciones anuladas', () => {
    const bet = applyLegs(parlay({ odds: 4.5 }), legs([1.8, 'WON'], [2.1, 'WON']));
    expect(bet.odds).toBe(4.5);
    expect(bet.profit).toBe(35);
  });

  it('en una freebet perder no resta', () => {
    expect(setLegStatus(parlay({ freebet: true }), 0, 'LOST').profit).toBe(0);
  });

  it('el cash out y la anulación no cambian con las selecciones', () => {
    const bet = applyLegs(parlay({ status: BetStatus.CASH_OUT, profit: 5 }), legs([1.8, 'WON'], [2.1, 'LOST']));
    expect(bet.status).toBe(BetStatus.CASH_OUT);
    expect(bet.profit).toBe(5);
  });

  it('ignora una selección que no existe', () => {
    const bet = parlay();
    expect(setLegStatus(bet, 9, 'WON')).toBe(bet);
  });
});

describe('resolveParlay (botones ✓ y ✗ de la apuesta entera)', () => {
  it('✓ gana todas las pendientes y respeta las anuladas', () => {
    const bet = resolveParlay(parlay({ odds: 3.78, legs: legs([1.8, 'PENDING'], [2.1, 'VOID'], [1.5, 'PENDING']) }), BetStatus.WON);
    expect(bet.legs!.map(l => l.status)).toEqual(['WON', 'VOID', 'WON']);
    expect(bet.status).toBe(BetStatus.WON);
    expect(bet.odds).toBe(2.7);
  });

  it('✗ pierde la primera pendiente', () => {
    const bet = resolveParlay(parlay({ legs: legs([1.8, 'WON'], [2.1, 'PENDING'], [1.5, 'PENDING']) }), BetStatus.LOST);
    expect(bet.legs!.map(l => l.status)).toEqual(['WON', 'LOST', 'PENDING']);
    expect(bet.status).toBe(BetStatus.LOST);
  });
});

describe('textos', () => {
  it('isParlay necesita al menos dos selecciones', () => {
    expect(isParlay({ legs: legs([1.8, 'PENDING']) })).toBe(false);
    expect(isParlay({ legs: legs([1.8, 'PENDING'], [2, 'PENDING']) })).toBe(true);
    expect(isParlay({})).toBe(false);
  });

  it('describe la combinada con sus selecciones', () => {
    expect(defaultParlayDescription([{ description: 'A gana' }, { description: ' B gana ' }, { description: '' }])).toBe('A gana + B gana');
    expect(defaultParlayDescription([{ description: '' }, { description: '' }])).toBe('Combinada de 2 selecciones');
  });

  it('legsToText resume cada selección', () => {
    expect(legsToText(legs([1.8, 'WON'], [2, 'VOID']))).toBe('Sel 1 @1,80 (Ganada) | Sel 2 @2,00 (Anulada)');
    expect(legsToText(undefined)).toBe('');
  });
});

describe('copia de seguridad con combinadas', () => {
  const bankroll = { id: 'b1', name: 'P', initialCapital: 100, color: '#000' };

  it('conserva las selecciones al exportar e importar', () => {
    const backup = buildBackup({ bets: [parlay()], bankrolls: [bankroll], bookmakers: [] });
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.bets[0].legs).toEqual(parlay().legs);
  });

  it('rechaza una combinada con una selección dañada', () => {
    const backup = buildBackup({ bets: [parlay()], bankrolls: [bankroll], bookmakers: [] });
    (backup.bets[0].legs as unknown as { status: string }[])[0].status = 'RARO';
    expect(parseBackup(JSON.stringify(backup)).ok).toBe(false);
  });

  it('las apuestas simples siguen sin selecciones', () => {
    const simple: Bet = { ...parlay(), legs: undefined };
    const parsed = parseBackup(JSON.stringify(buildBackup({ bets: [simple], bankrolls: [bankroll], bookmakers: [] })));
    expect(parsed.ok && parsed.data.bets[0].legs).toBeFalsy();
  });
});
