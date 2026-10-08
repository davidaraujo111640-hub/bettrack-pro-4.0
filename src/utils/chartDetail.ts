import { Bet, BetStatus } from '../../types';
import { round2 } from './betMath';

/** Un punto de la curva: el estado tras cada operación cerrada (el punto 0 es el inicio). */
export interface DetailPoint {
  /** Posición en la serie completa (0 = inicio) */
  index: number;
  /** "AAAA-MM-DD" ('' en el inicio) */
  date: string;
  /** Valor de la curva: capital de partida + beneficio acumulado */
  value: number;
  /** Beneficio de esta operación */
  change: number;
  description: string;
  bookmaker: string;
  sport: string;
  status: BetStatus | null;
  stake: number;
  odds: number;
  /** Valor máximo alcanzado hasta este punto */
  peak: number;
  /** Caída desde ese máximo (0 o negativo) */
  drawdown: number;
}

/**
 * Serie para la gráfica detallada: apuestas cerradas en orden cronológico (a igual fecha, en el orden
 * en que se registraron), con el valor acumulado a partir de `baseline` (0 para el profit, el capital
 * inicial para el saldo del bankroll).
 */
export function buildDetailSeries(bets: Bet[], baseline: number): DetailPoint[] {
  // Las apuestas se guardan de más nueva a más antigua: se invierten para conservar el orden de registro
  const closed = [...bets]
    .reverse()
    .filter(b => b.status !== BetStatus.PENDING)
    .sort((a, b) => a.date.localeCompare(b.date));

  const start = round2(baseline);
  const points: DetailPoint[] = [{
    index: 0, date: '', value: start, change: 0, description: 'Inicio', bookmaker: '', sport: '',
    status: null, stake: 0, odds: 0, peak: start, drawdown: 0,
  }];

  let cumulative = 0;
  let peak = start;
  closed.forEach((bet, i) => {
    cumulative = round2(cumulative + bet.profit);
    const value = round2(baseline + cumulative);
    peak = Math.max(peak, value);
    points.push({
      index: i + 1, date: bet.date, value, change: bet.profit,
      description: bet.description || bet.sport, bookmaker: bet.bookmaker, sport: bet.sport,
      status: bet.status, stake: bet.stake, odds: bet.odds,
      peak, drawdown: round2(value - peak),
    });
  });
  return points;
}

/** Rangos que se ofrecen para acercar la gráfica: todo, o solo las últimas N operaciones */
export const RANGE_OPTIONS = [null, 100, 50, 20] as const;

/** Los últimos `lastOps` puntos (más el anterior, para ver desde dónde se partía); todo si es null o no hace falta recortar. */
export function rangePoints(points: DetailPoint[], lastOps: number | null): DetailPoint[] {
  if (lastOps === null || points.length <= lastOps + 1) return points;
  return points.slice(points.length - (lastOps + 1));
}

export interface SeriesStats {
  /** Operaciones cerradas (sin contar el inicio) */
  ops: number;
  current: number;
  max: number;
  min: number;
  bestChange: number;
  worstChange: number;
  maxDrawdown: number;
}

export function seriesStats(points: DetailPoint[]): SeriesStats {
  // El primer punto es la referencia de partida (el inicio, o la operación anterior al tramo): no cuenta como operación
  const ops = points.slice(1);
  const values = points.map(p => p.value);
  return {
    ops: ops.length,
    current: points.length ? points[points.length - 1].value : 0,
    max: values.length ? Math.max(...values) : 0,
    min: values.length ? Math.min(...values) : 0,
    bestChange: ops.length ? Math.max(0, ...ops.map(p => p.change)) : 0,
    worstChange: ops.length ? Math.min(0, ...ops.map(p => p.change)) : 0,
    maxDrawdown: points.length ? Math.min(0, ...points.map(p => p.drawdown)) : 0,
  };
}

/** Qué punto corresponde a una posición horizontal dentro del área de la gráfica */
export function indexFromPosition(x: number, width: number, first: number, last: number): number {
  if (!(width > 0) || last <= first) return first;
  const fraction = Math.min(1, Math.max(0, x / width));
  return first + Math.round(fraction * (last - first));
}

/**
 * Posición del dedo dentro del área de la gráfica. Si el contenido está girado 90° (móvil en vertical),
 * el eje horizontal de la gráfica es el vertical de la pantalla.
 */
export function pointerToChart(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  rotated: boolean,
): { x: number; width: number } {
  return rotated
    ? { x: clientY - rect.top, width: rect.height }
    : { x: clientX - rect.left, width: rect.width };
}

/**
 * Punto del degradado (de arriba abajo) donde la curva cruza la línea de partida: verde por encima,
 * rojo por debajo. Hay uno para la línea (solo los valores) y otro para el relleno (que llega hasta la línea de partida).
 */
export function gradientOffsets(values: number[], baseline: number): { stroke: number; fill: number } {
  const max = values.length ? Math.max(...values) : baseline;
  const min = values.length ? Math.min(...values) : baseline;
  const ratio = (top: number, bottom: number) => (top === bottom ? (top >= baseline ? 1 : 0) : Math.min(1, Math.max(0, (top - baseline) / (top - bottom))));
  return {
    stroke: ratio(max, min),
    fill: ratio(Math.max(max, baseline), Math.min(min, baseline)),
  };
}

/** Marcas del eje horizontal: unas cuantas posiciones repartidas entre la primera y la última, sin repetir */
export function tickIndexes(first: number, last: number, maxTicks: number): number[] {
  if (last <= first) return [first];
  const count = Math.min(maxTicks, last - first + 1);
  const ticks = new Set<number>();
  for (let i = 0; i < count; i++) ticks.add(first + Math.round((i * (last - first)) / Math.max(1, count - 1)));
  return [...ticks];
}

/** Marcas "redondas" (múltiplos de 1, 2, 2,5 o 5 por una potencia de 10) dentro de un rango, para el eje vertical */
export function niceTicks(min: number, max: number, target = 5): number[] {
  const span = max - min;
  if (!(span > 0)) return [min];
  const rough = span / Math.max(1, target - 1);
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(s => s >= rough) ?? pow * 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}
