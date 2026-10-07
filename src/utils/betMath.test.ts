import { describe, it, expect } from 'vitest';
import { Bet, BetStatus } from '../../types';
import {
  calculateProfit,
  calculateRoi,
  calculateYield,
  parseDecimal,
  round2,
  validateBetForm,
  BetFormValues,
  buildEquityCurve,
  computeBetStats,
  getPayout,
} from './betMath';

describe('calculateProfit', () => {
  it('ganada: stake * cuota - stake', () => {
    expect(calculateProfit(BetStatus.WON, 1.85, 10)).toBe(8.5);
  });

  it('ganada: redondea a céntimos (sin errores de coma flotante)', () => {
    expect(calculateProfit(BetStatus.WON, 1.1, 10)).toBe(1);
    expect(calculateProfit(BetStatus.WON, 2.37, 33.33)).toBe(45.66);
  });

  it('perdida: -stake', () => {
    expect(calculateProfit(BetStatus.LOST, 1.85, 10)).toBe(-10);
  });

  it('cash out: importe cobrado - stake', () => {
    expect(calculateProfit(BetStatus.CASH_OUT, 2, 150, 162)).toBe(12);
    expect(calculateProfit(BetStatus.CASH_OUT, 2, 150, 100)).toBe(-50);
  });

  it('cash out sin importe: se pierde el stake', () => {
    expect(calculateProfit(BetStatus.CASH_OUT, 2, 150)).toBe(-150);
  });

  it('pendiente, reembolsada y anulada: 0', () => {
    expect(calculateProfit(BetStatus.PENDING, 1.85, 10)).toBe(0);
    expect(calculateProfit(BetStatus.REFUNDED, 1.85, 10)).toBe(0);
    expect(calculateProfit(BetStatus.CANCELLED, 1.85, 10)).toBe(0);
  });
});

describe('calculateYield y calculateRoi', () => {
  it('yield = beneficio / total apostado', () => {
    expect(calculateYield(50, 500)).toBe(10);
  });

  it('roi = beneficio / capital inicial', () => {
    expect(calculateRoi(50, 1000)).toBe(5);
  });

  it('devuelven 0 si no hay base sobre la que calcular', () => {
    expect(calculateYield(50, 0)).toBe(0);
    expect(calculateRoi(50, 0)).toBe(0);
  });
});

describe('parseDecimal', () => {
  it('acepta punto y coma decimal', () => {
    expect(parseDecimal('1.85')).toBe(1.85);
    expect(parseDecimal('1,85')).toBe(1.85);
    expect(parseDecimal(' 10 ')).toBe(10);
  });

  it('rechaza texto no numérico', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('1.8.5')).toBeNaN();
    expect(parseDecimal('-5')).toBeNaN();
    expect(parseDecimal('10€')).toBeNaN();
  });
});

describe('round2', () => {
  it('redondea a 2 decimales', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(-3.456)).toBe(-3.46);
  });
});

describe('validateBetForm', () => {
  const valid: BetFormValues = {
    date: '2026-10-06',
    bookmaker: 'Bet365',
    status: BetStatus.PENDING,
    odds: '1.85',
    stake: '10',
    cashOutAmount: '0',
  };

  it('acepta un formulario correcto', () => {
    expect(validateBetForm(valid)).toBeNull();
  });

  it('rechaza cuota vacía, no numérica o fuera de rango', () => {
    expect(validateBetForm({ ...valid, odds: '' })).not.toBeNull();
    expect(validateBetForm({ ...valid, odds: 'abc' })).not.toBeNull();
    expect(validateBetForm({ ...valid, odds: '1' })).not.toBeNull();
    expect(validateBetForm({ ...valid, odds: '5000' })).not.toBeNull();
  });

  it('rechaza importe vacío, cero o no numérico', () => {
    expect(validateBetForm({ ...valid, stake: '' })).not.toBeNull();
    expect(validateBetForm({ ...valid, stake: '0' })).not.toBeNull();
    expect(validateBetForm({ ...valid, stake: 'diez' })).not.toBeNull();
  });

  it('rechaza casa de apuestas o fecha vacías', () => {
    expect(validateBetForm({ ...valid, bookmaker: '  ' })).not.toBeNull();
    expect(validateBetForm({ ...valid, date: '' })).not.toBeNull();
  });

  it('exige un importe válido en cash out', () => {
    expect(validateBetForm({ ...valid, status: BetStatus.CASH_OUT, cashOutAmount: '' })).not.toBeNull();
    expect(validateBetForm({ ...valid, status: BetStatus.CASH_OUT, cashOutAmount: '162' })).toBeNull();
  });
});

describe('buildEquityCurve', () => {
  const bet = (date: string, status: BetStatus, profit: number): Bet => ({
    id: `${date}-${profit}`, bankrollId: 'b', date, bookmaker: 'X', sport: 'Fútbol',
    odds: 2, stake: 10, status, profit, description: '',
  });

  it('calcula saldo, máximo y drawdown en orden cronológico', () => {
    // Guardadas de más nueva a más antigua, como en la app
    const bets = [
      bet('2026-01-04', BetStatus.WON, 30),
      bet('2026-01-03', BetStatus.LOST, -40),
      bet('2026-01-02', BetStatus.LOST, -20),
      bet('2026-01-01', BetStatus.WON, 50),
    ];
    const curve = buildEquityCurve(bets, 100);
    expect(curve.points.map(p => p.balance)).toEqual([100, 150, 130, 90, 120]);
    expect(curve.points.map(p => p.drawdown)).toEqual([0, 0, -20, -60, -30]);
    expect(curve.peak).toBe(150);
    expect(curve.maxDrawdown).toBe(-60);
    expect(curve.maxDrawdownPct).toBe(-40);
    expect(curve.currentDrawdown).toBe(-30);
    expect(curve.currentDrawdownPct).toBe(-20);
  });

  it('ignora las apuestas pendientes', () => {
    const curve = buildEquityCurve([bet('2026-01-02', BetStatus.PENDING, 0), bet('2026-01-01', BetStatus.WON, 10)], 100);
    expect(curve.points).toHaveLength(2);
  });

  it('sin caídas el drawdown es 0', () => {
    const curve = buildEquityCurve([bet('2026-01-02', BetStatus.WON, 5), bet('2026-01-01', BetStatus.WON, 5)], 100);
    expect(curve.maxDrawdown).toBe(0);
    expect(curve.currentDrawdown).toBe(0);
  });

  it('a igual fecha respeta el orden en que se registraron', () => {
    // La primera registrada (al final del array) es la pérdida
    const curve = buildEquityCurve([bet('2026-01-01', BetStatus.WON, 30), bet('2026-01-01', BetStatus.LOST, -10)], 100);
    expect(curve.points.map(p => p.balance)).toEqual([100, 90, 120]);
  });
});

describe('computeBetStats', () => {
  const mk = (id: string, date: string, status: BetStatus, odds: number, stake: number, profit: number, bookmaker = 'Bet365', sport: Bet['sport'] = 'Fútbol'): Bet =>
    ({ id, bankrollId: 'b', date, bookmaker, sport, odds, stake, status, profit, description: '' });
  // Guardadas de más nueva a más antigua
  const bets = [
    mk('6', '2026-02-03', BetStatus.PENDING, 1.8, 20, 0),
    mk('5', '2026-02-02', BetStatus.REFUNDED, 2, 10, 0),
    mk('4', '2026-02-01', BetStatus.LOST, 3.5, 10, -10, 'Codere', 'Tenis'),
    mk('3', '2026-01-03', BetStatus.WON, 1.4, 50, 20),
    mk('2', '2026-01-02', BetStatus.WON, 2, 10, 10),
    mk('1', '2026-01-01', BetStatus.LOST, 2.5, 20, -20, 'Codere'),
  ];
  const s = computeBetStats(bets, 1000);

  it('cuenta apuestas por estado', () => {
    expect(s).toMatchObject({ total: 6, closed: 4, pending: 1, won: 2, lost: 2, voided: 1 });
  });

  it('calcula beneficio, yield, ROI y acierto sin contar anuladas ni pendientes', () => {
    expect(s.staked).toBe(90);
    expect(s.profit).toBe(0);
    expect(s.winRate).toBe(50);
    expect(s.roi).toBe(0);
    expect(s.pendingStake).toBe(20);
  });

  it('calcula extremos, factor de beneficio y rachas', () => {
    expect(s.biggestWin).toBe(20);
    expect(s.biggestLoss).toBe(-20);
    expect(s.profitFactor).toBe(1);
    expect(s.bestWinStreak).toBe(2);
    expect(s.worstLoseStreak).toBe(1);
    expect(s.currentStreak).toBe(-1);
  });

  it('agrupa por casa, cuota y mes', () => {
    expect(s.byBookmaker.find(g => g.key === 'Codere')).toMatchObject({ bets: 2, profit: -30 });
    expect(s.byOdds.map(g => g.key)).toEqual(['< 1.50', '1.50 - 1.99', '2.00 - 2.99', '3.00 - 4.99']);
    expect(s.byMonth.map(g => g.key)).toEqual(['2026-02', '2026-01']);
  });
});

describe('freebets', () => {
  it('ganada: solo la ganancia neta', () => {
    expect(calculateProfit(BetStatus.WON, 3, 10, undefined, true)).toBe(20);
  });

  it('perdida: no resta nada', () => {
    expect(calculateProfit(BetStatus.LOST, 3, 10, undefined, true)).toBe(0);
  });

  it('cash out: todo lo cobrado es beneficio', () => {
    expect(calculateProfit(BetStatus.CASH_OUT, 3, 10, 7, true)).toBe(7);
  });

  it('no cuentan como dinero apostado en el yield, pero su beneficio sí suma', () => {
    const mk = (id: string, status: BetStatus, stake: number, profit: number, freebet = false): Bet =>
      ({ id, bankrollId: 'b', date: '2026-01-0' + id, bookmaker: 'X', sport: 'Fútbol', odds: 3, stake, status, profit, description: '', freebet });
    const s = computeBetStats([mk('1', BetStatus.WON, 10, 10), mk('2', BetStatus.WON, 10, 20, true), mk('3', BetStatus.LOST, 10, 0, true)], 1000);
    expect(s.staked).toBe(10);
    expect(s.profit).toBe(30);
    expect(s.yield).toBe(300);
    expect(s.freebets).toBe(2);
    expect(s.freebetProfit).toBe(20);
  });
});

describe('getPayout', () => {
  const b = (status: BetStatus, stake: number, profit: number, freebet = false) => ({ status, stake, profit, freebet });
  it('ganada: importe + ganancia', () => expect(getPayout(b(BetStatus.WON, 10, 8.5))).toBe(18.5));
  it('cash out: lo cobrado', () => expect(getPayout(b(BetStatus.CASH_OUT, 10, 5))).toBe(15));
  it('freebet ganada: solo la ganancia', () => expect(getPayout(b(BetStatus.WON, 10, 20, true))).toBe(20));
  it('pendiente o perdida: nada', () => {
    expect(getPayout(b(BetStatus.PENDING, 10, 0))).toBeNull();
    expect(getPayout(b(BetStatus.LOST, 10, -10))).toBeNull();
  });
});
