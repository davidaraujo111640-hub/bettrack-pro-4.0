import { describe, expect, it } from 'vitest';
import { Bet, BetStatus } from '../../types';
import { buildDetailSeries, gradientOffsets, indexFromPosition, niceTicks, pointerToChart, rangePoints, seriesStats, tickIndexes } from './chartDetail';

const bet = (id: string, date: string, profit: number, status = BetStatus.WON, extra: Partial<Bet> = {}): Bet => ({
  id, bankrollId: 'b', date, bookmaker: 'Bet365', sport: 'Fútbol', odds: 2, stake: 10, status, profit, description: `Apuesta ${id}`, ...extra,
});

// Las apuestas llegan de más nueva a más antigua
const bets = [
  bet('c', '2026-10-03', -10, BetStatus.LOST),
  bet('p', '2026-10-03', 0, BetStatus.PENDING),
  bet('b', '2026-10-02', 25),
  bet('a', '2026-10-01', 10),
];

describe('buildDetailSeries', () => {
  it('parte del valor inicial y acumula solo las apuestas cerradas, en orden cronológico', () => {
    const s = buildDetailSeries(bets, 0);
    expect(s.map(p => p.value)).toEqual([0, 10, 35, 25]);
    expect(s.map(p => p.index)).toEqual([0, 1, 2, 3]);
    expect(s[0].description).toBe('Inicio');
    expect(s[1]).toMatchObject({ date: '2026-10-01', change: 10, description: 'Apuesta a', bookmaker: 'Bet365' });
  });

  it('con un capital de partida, la curva es el saldo del bankroll', () => {
    expect(buildDetailSeries(bets, 1000).map(p => p.value)).toEqual([1000, 1010, 1035, 1025]);
  });

  it('calcula el máximo y la caída desde él', () => {
    const s = buildDetailSeries(bets, 0);
    expect(s[2]).toMatchObject({ peak: 35, drawdown: 0 });
    expect(s[3]).toMatchObject({ peak: 35, drawdown: -10 });
  });

  it('a igual fecha conserva el orden en que se registraron', () => {
    const same = [bet('segunda', '2026-10-01', -5, BetStatus.LOST), bet('primera', '2026-10-01', 10)];
    expect(buildDetailSeries(same, 0).map(p => p.description)).toEqual(['Inicio', 'Apuesta primera', 'Apuesta segunda']);
  });

  it('sin apuestas cerradas solo queda el inicio', () => {
    expect(buildDetailSeries([bet('x', '2026-10-01', 0, BetStatus.PENDING)], 500)).toHaveLength(1);
    expect(buildDetailSeries([], 500)[0].value).toBe(500);
  });

  it('usa el deporte si la apuesta no tiene descripción', () => {
    expect(buildDetailSeries([bet('x', '2026-10-01', 5, BetStatus.WON, { description: '' })], 0)[1].description).toBe('Fútbol');
  });
});

describe('rangePoints', () => {
  const series = buildDetailSeries(Array.from({ length: 30 }, (_, i) => bet(String(i), `2026-09-${String(30 - i).padStart(2, '0')}`, 1)), 0);

  it('devuelve todo si no se pide recortar o ya cabe', () => {
    expect(rangePoints(series, null)).toBe(series);
    expect(rangePoints(series, 50)).toBe(series);
  });

  it('se queda con las últimas N operaciones y el punto anterior', () => {
    const last = rangePoints(series, 20);
    expect(last).toHaveLength(21);
    expect(last[0].index).toBe(10);
    expect(last[last.length - 1].index).toBe(30);
  });
});

describe('seriesStats', () => {
  it('resume la serie', () => {
    expect(seriesStats(buildDetailSeries(bets, 0))).toEqual({
      ops: 3, current: 25, max: 35, min: 0, bestChange: 25, worstChange: -10, maxDrawdown: -10,
    });
  });

  it('en un tramo recortado no cuenta como operación el punto de partida', () => {
    const full = buildDetailSeries(Array.from({ length: 30 }, (_, i) => bet(String(i), `2026-09-${String(30 - i).padStart(2, '0')}`, 1)), 0);
    expect(seriesStats(rangePoints(full, 20)).ops).toBe(20);
    expect(seriesStats(full).ops).toBe(30);
  });

  it('no falla con la serie vacía', () => {
    expect(seriesStats([])).toMatchObject({ ops: 0, current: 0 });
  });
});

describe('indexFromPosition', () => {
  it('reparte el ancho entre los puntos y se queda dentro del rango', () => {
    expect(indexFromPosition(0, 100, 0, 10)).toBe(0);
    expect(indexFromPosition(50, 100, 0, 10)).toBe(5);
    expect(indexFromPosition(100, 100, 0, 10)).toBe(10);
    expect(indexFromPosition(-30, 100, 0, 10)).toBe(0);
    expect(indexFromPosition(999, 100, 0, 10)).toBe(10);
  });

  it('respeta un rango que no empieza en 0', () => {
    expect(indexFromPosition(50, 100, 10, 30)).toBe(20);
  });

  it('con datos degenerados devuelve el primero', () => {
    expect(indexFromPosition(10, 0, 3, 9)).toBe(3);
    expect(indexFromPosition(10, 100, 5, 5)).toBe(5);
  });
});

describe('pointerToChart', () => {
  const rect = { left: 20, top: 40, width: 300, height: 600 };

  it('sin girar usa el eje horizontal', () => {
    expect(pointerToChart(170, 100, rect, false)).toEqual({ x: 150, width: 300 });
  });

  it('girado 90°, la gráfica avanza hacia abajo en la pantalla', () => {
    expect(pointerToChart(170, 340, rect, true)).toEqual({ x: 300, width: 600 });
    expect(pointerToChart(170, 40, rect, true)).toEqual({ x: 0, width: 600 });
  });
});

describe('gradientOffsets', () => {
  it('todo por encima de la línea de partida: todo verde', () => {
    expect(gradientOffsets([10, 20, 30], 0)).toEqual({ stroke: 1, fill: 1 });
  });

  it('todo por debajo: todo rojo', () => {
    expect(gradientOffsets([-10, -20, -30], 0)).toEqual({ stroke: 0, fill: 0 });
  });

  it('cruza la línea: el corte está en proporción', () => {
    const o = gradientOffsets([-10, 30], 0);
    expect(o.stroke).toBeCloseTo(0.75);
    expect(o.fill).toBeCloseTo(0.75);
  });

  it('el relleno llega hasta la línea de partida aunque la curva no la toque', () => {
    const o = gradientOffsets([20, 30], 0);
    expect(o.stroke).toBe(1);
    expect(o.fill).toBe(1);
    expect(gradientOffsets([], 5)).toEqual({ stroke: 1, fill: 1 });
  });
});

describe('tickIndexes', () => {
  it('reparte las marcas incluyendo los extremos', () => {
    expect(tickIndexes(0, 10, 3)).toEqual([0, 5, 10]);
    expect(tickIndexes(0, 4, 8)).toEqual([0, 1, 2, 3, 4]);
  });

  it('con un solo punto devuelve ese punto', () => {
    expect(tickIndexes(7, 7, 5)).toEqual([7]);
  });
});

describe('niceTicks', () => {
  it('da marcas redondas e incluye el 0 cuando el rango lo cruza', () => {
    const t = niceTicks(-158, 129, 5);
    expect(t).toContain(0);
    expect(t.every(v => v % 50 === 0)).toBe(true);
    expect(t[0]).toBeGreaterThanOrEqual(-158);
    expect(t[t.length - 1]).toBeLessThanOrEqual(129);
  });

  it('funciona con saldos lejos del cero', () => {
    const t = niceTicks(980, 1130, 5);
    expect(t.length).toBeGreaterThanOrEqual(3);
    expect(t.every(v => v >= 980 && v <= 1130)).toBe(true);
  });

  it('con rango nulo o pequeño no falla', () => {
    expect(niceTicks(5, 5)).toEqual([5]);
    expect(niceTicks(0, 0.4, 5).length).toBeGreaterThan(1);
  });
});
