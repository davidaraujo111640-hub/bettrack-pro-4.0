import { Bet, BetStatus } from '../../types';

// Redondea a céntimos para evitar errores de coma flotante (1.1 * 10 - 10 = 1.0000000000000009)
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Beneficio neto de una apuesta según su estado.
 * - Ganada: stake * cuota - stake (en una freebet el importe no se devuelve, así que es lo mismo)
 * - Perdida: -stake (0 si es freebet: el importe no era tuyo)
 * - Cash out: importe total cobrado - stake (todo lo cobrado si es freebet)
 * - Pendiente, reembolsada o anulada: 0
 */
export function calculateProfit(status: BetStatus, odds: number, stake: number, cashOutAmount?: number, freebet = false): number {
  switch (status) {
    case BetStatus.WON:
      return round2(stake * odds - stake);
    case BetStatus.LOST:
      return freebet ? 0 : round2(-stake);
    case BetStatus.CASH_OUT:
      return round2((cashOutAmount ?? 0) - (freebet ? 0 : stake));
    default:
      return 0;
  }
}

/** Dinero real apostado: las freebets no cuentan porque el importe no es tuyo. */
export const realStake = (bet: { stake: number; freebet?: boolean }): number => (bet.freebet ? 0 : bet.stake);

/** Yield: beneficio respecto al total apostado (en %). */
export function calculateYield(profit: number, totalStaked: number): number {
  return totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
}

/** ROI: beneficio respecto al capital inicial del bankroll (en %). */
export function calculateRoi(profit: number, initialCapital: number): number {
  return initialCapital > 0 ? (profit / initialCapital) * 100 : 0;
}

/** Convierte "1,85" o "1.85" en número. Devuelve NaN si el texto no es un número válido. */
export function parseDecimal(value: string): number {
  const clean = value.trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(clean) ? parseFloat(clean) : NaN;
}

export const MIN_ODDS = 1.01;
export const MAX_ODDS = 1000;

export interface BetFormValues {
  date: string;
  bookmaker: string;
  status: BetStatus;
  odds: string;
  stake: string;
  cashOutAmount: string;
}

/** Valida el formulario de apuesta. Devuelve un mensaje de error o null si todo es correcto. */
export function validateBetForm(values: BetFormValues): string | null {
  if (!values.date) return 'Indica la fecha de la apuesta.';
  if (!values.bookmaker.trim()) return 'Indica la casa de apuestas.';

  const odds = parseDecimal(values.odds);
  if (Number.isNaN(odds)) return 'La cuota debe ser un número (por ejemplo 1.85).';
  if (odds < MIN_ODDS || odds > MAX_ODDS) return `La cuota debe estar entre ${MIN_ODDS} y ${MAX_ODDS}.`;

  const stake = parseDecimal(values.stake);
  if (Number.isNaN(stake)) return 'El importe debe ser un número (por ejemplo 10 o 10.50).';
  if (stake <= 0) return 'El importe debe ser mayor que 0.';

  if (values.status === BetStatus.CASH_OUT) {
    const cashOut = parseDecimal(values.cashOutAmount);
    if (Number.isNaN(cashOut)) return 'El importe cobrado en el cash out debe ser un número.';
  }

  return null;
}

export interface EquityPoint {
  name: string;
  date: string;
  profit: number;
  /** Beneficio acumulado hasta esta apuesta */
  cumulative: number;
  /** Saldo del bankroll: capital inicial + beneficio acumulado */
  balance: number;
  /** Saldo máximo alcanzado hasta este punto */
  peak: number;
  /** Caída desde el máximo, en € (0 o negativo) */
  drawdown: number;
  /** Caída desde el máximo, en % del máximo (0 o negativo) */
  drawdownPct: number;
}

export interface EquityCurve {
  points: EquityPoint[];
  peak: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  currentDrawdown: number;
  currentDrawdownPct: number;
}

/**
 * Evolución del bankroll apuesta a apuesta (solo apuestas cerradas, en orden cronológico),
 * con el drawdown: cuánto ha caído el saldo desde su máximo anterior.
 */
export function buildEquityCurve(bets: Bet[], initialCapital: number): EquityCurve {
  // Las apuestas se guardan de más nueva a más antigua: se invierten para que, a igual
  // fecha, se mantenga el orden en que se registraron (sort es estable).
  const closed = [...bets]
    .reverse()
    .filter(b => b.status !== BetStatus.PENDING)
    .sort((a, b) => a.date.localeCompare(b.date));

  const points: EquityPoint[] = [{
    name: 'Inicio', date: '', profit: 0, cumulative: 0,
    balance: round2(initialCapital), peak: round2(initialCapital), drawdown: 0, drawdownPct: 0,
  }];

  let cumulative = 0;
  let peak = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  closed.forEach((bet, i) => {
    cumulative = round2(cumulative + bet.profit);
    const balance = round2(initialCapital + cumulative);
    peak = Math.max(peak, balance);
    const drawdown = round2(balance - peak);
    const drawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPct = drawdownPct;
    }
    points.push({
      name: `Op. ${i + 1}`,
      date: new Date(bet.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      profit: bet.profit,
      cumulative,
      balance,
      peak,
      drawdown,
      drawdownPct,
    });
  });

  const last = points[points.length - 1];
  return {
    points,
    peak,
    maxDrawdown,
    maxDrawdownPct,
    currentDrawdown: last.drawdown,
    currentDrawdownPct: last.drawdownPct,
  };
}

export interface GroupStats {
  key: string;
  bets: number;
  won: number;
  lost: number;
  staked: number;
  profit: number;
  yield: number;
  winRate: number;
}

export interface BetStats {
  total: number;
  closed: number;
  pending: number;
  won: number;
  lost: number;
  cashOut: number;
  voided: number;
  winRate: number;
  staked: number;
  pendingStake: number;
  profit: number;
  yield: number;
  roi: number;
  avgStake: number;
  maxStake: number;
  /** Número de freebets y beneficio obtenido con ellas */
  freebets: number;
  freebetProfit: number;
  avgOdds: number;
  avgOddsWon: number;
  biggestWin: number;
  biggestLoss: number;
  grossWins: number;
  grossLosses: number;
  /** Ganancias brutas / pérdidas brutas (null si no hay pérdidas) */
  profitFactor: number | null;
  bestWinStreak: number;
  worstLoseStreak: number;
  /** Racha actual: positiva = ganadas seguidas, negativa = perdidas seguidas */
  currentStreak: number;
  byBookmaker: GroupStats[];
  bySport: GroupStats[];
  byOdds: GroupStats[];
  byMonth: GroupStats[];
}

export const ODDS_RANGES: [string, number, number][] = [
  ['< 1.50', 0, 1.5],
  ['1.50 - 1.99', 1.5, 2],
  ['2.00 - 2.99', 2, 3],
  ['3.00 - 4.99', 3, 5],
  ['≥ 5.00', 5, Infinity],
];

const isWin = (b: Bet) => b.status === BetStatus.WON || (b.status === BetStatus.CASH_OUT && b.profit > 0);
const isLoss = (b: Bet) => b.status === BetStatus.LOST || (b.status === BetStatus.CASH_OUT && b.profit < 0);
// Las anuladas y reembolsadas no cuentan para el acierto ni el yield
const counts = (b: Bet) => b.status !== BetStatus.PENDING && b.status !== BetStatus.REFUNDED && b.status !== BetStatus.CANCELLED;

function group(bets: Bet[], keyOf: (b: Bet) => string, order?: string[]): GroupStats[] {
  const map = new Map<string, Bet[]>();
  for (const b of bets) {
    const k = keyOf(b);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(b);
  }
  const rows = [...map.entries()].map(([key, list]) => {
    const settled = list.filter(counts);
    const staked = round2(settled.reduce((a, b) => a + realStake(b), 0));
    const profit = round2(settled.reduce((a, b) => a + b.profit, 0));
    const won = settled.filter(isWin).length;
    return {
      key,
      bets: list.length,
      won,
      lost: settled.filter(isLoss).length,
      staked,
      profit,
      yield: calculateYield(profit, staked),
      winRate: settled.length ? (won / settled.length) * 100 : 0,
    };
  });
  return order ? rows.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)) : rows.sort((a, b) => b.profit - a.profit);
}

/** Estadísticas completas de un conjunto de apuestas (por ejemplo, las de un bankroll). */
export function computeBetStats(bets: Bet[], initialCapital: number): BetStats {
  const settled = bets.filter(counts);
  const pending = bets.filter(b => b.status === BetStatus.PENDING);
  const freebets = bets.filter(b => b.freebet);
  const realBets = bets.filter(b => !b.freebet);
  const staked = round2(settled.reduce((a, b) => a + realStake(b), 0));
  const profit = round2(settled.reduce((a, b) => a + b.profit, 0));
  const wins = settled.filter(isWin);
  const grossWins = round2(settled.filter(b => b.profit > 0).reduce((a, b) => a + b.profit, 0));
  const grossLosses = round2(-settled.filter(b => b.profit < 0).reduce((a, b) => a + b.profit, 0));

  // Rachas en orden cronológico (las apuestas se guardan de más nueva a más antigua)
  const chrono = [...settled].reverse().sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, worst = 0, run = 0;
  for (const b of chrono) {
    if (isWin(b)) run = run > 0 ? run + 1 : 1;
    else if (isLoss(b)) run = run < 0 ? run - 1 : -1;
    else continue;
    best = Math.max(best, run);
    worst = Math.min(worst, run);
  }

  return {
    total: bets.length,
    closed: settled.length,
    pending: pending.length,
    won: bets.filter(b => b.status === BetStatus.WON).length,
    lost: bets.filter(b => b.status === BetStatus.LOST).length,
    cashOut: bets.filter(b => b.status === BetStatus.CASH_OUT).length,
    voided: bets.filter(b => b.status === BetStatus.REFUNDED || b.status === BetStatus.CANCELLED).length,
    winRate: settled.length ? (wins.length / settled.length) * 100 : 0,
    staked,
    pendingStake: round2(pending.reduce((a, b) => a + realStake(b), 0)),
    profit,
    yield: calculateYield(profit, staked),
    roi: calculateRoi(profit, initialCapital),
    avgStake: realBets.length ? round2(realBets.reduce((a, b) => a + b.stake, 0) / realBets.length) : 0,
    maxStake: realBets.length ? Math.max(...realBets.map(b => b.stake)) : 0,
    freebets: freebets.length,
    freebetProfit: round2(freebets.filter(counts).reduce((a, b) => a + b.profit, 0)),
    avgOdds: bets.length ? round2(bets.reduce((a, b) => a + b.odds, 0) / bets.length) : 0,
    avgOddsWon: wins.length ? round2(wins.reduce((a, b) => a + b.odds, 0) / wins.length) : 0,
    biggestWin: settled.length ? Math.max(0, ...settled.map(b => b.profit)) : 0,
    biggestLoss: settled.length ? Math.min(0, ...settled.map(b => b.profit)) : 0,
    grossWins,
    grossLosses,
    profitFactor: grossLosses > 0 ? round2(grossWins / grossLosses) : null,
    bestWinStreak: best,
    worstLoseStreak: -worst,
    currentStreak: run,
    byBookmaker: group(bets, b => b.bookmaker || 'Sin casa'),
    bySport: group(bets, b => b.sport),
    byOdds: group(bets, b => ODDS_RANGES.find(([, lo, hi]) => b.odds >= lo && b.odds < hi)?.[0] ?? '≥ 5.00', ODDS_RANGES.map(r => r[0])),
    byMonth: group(bets, b => b.date.slice(0, 7)).sort((a, b) => b.key.localeCompare(a.key)),
  };
}

/**
 * Total cobrado de una apuesta: lo que paga la casa (importe + ganancia).
 * En una freebet el importe no se devuelve, así que lo cobrado es solo el beneficio.
 * Devuelve null si la apuesta no se ha cobrado (pendiente, perdida, anulada…).
 */
export function getPayout(bet: { status: BetStatus; stake: number; profit: number; freebet?: boolean }): number | null {
  if (bet.status !== BetStatus.WON && bet.status !== BetStatus.CASH_OUT) return null;
  return round2(bet.freebet ? bet.profit : bet.stake + bet.profit);
}
