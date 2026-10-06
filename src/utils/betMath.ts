import { Bet, BetStatus } from '../../types';

// Redondea a céntimos para evitar errores de coma flotante (1.1 * 10 - 10 = 1.0000000000000009)
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Beneficio neto de una apuesta según su estado.
 * - Ganada: stake * cuota - stake
 * - Perdida: -stake
 * - Cash out: importe total cobrado - stake
 * - Pendiente, reembolsada o anulada: 0
 */
export function calculateProfit(status: BetStatus, odds: number, stake: number, cashOutAmount?: number): number {
  switch (status) {
    case BetStatus.WON:
      return round2(stake * odds - stake);
    case BetStatus.LOST:
      return round2(-stake);
    case BetStatus.CASH_OUT:
      return round2((cashOutAmount ?? 0) - stake);
    default:
      return 0;
  }
}

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
