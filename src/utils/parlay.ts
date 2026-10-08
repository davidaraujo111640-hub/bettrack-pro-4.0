import { Bet, BetLeg, BetStatus, LegStatus } from '../../types';
import { calculateProfit, round2 } from './betMath';

export const LEG_STATUSES: LegStatus[] = ['PENDING', 'WON', 'LOST', 'VOID'];

export const LEG_STATUS_LABELS: Record<LegStatus, string> = {
  PENDING: 'Pendiente',
  WON: 'Ganada',
  LOST: 'Perdida',
  VOID: 'Anulada',
};

/** Mínimo de selecciones para que una apuesta sea una combinada */
export const MIN_LEGS = 2;

export const isParlay = (bet: { legs?: BetLeg[] }): boolean => (bet.legs?.length ?? 0) >= MIN_LEGS;

/** Cuota total de la combinada: producto de las cuotas de las selecciones que cuentan (las anuladas no cuentan). */
export function comboOdds(legs: Pick<BetLeg, 'odds' | 'status'>[]): number {
  const counted = legs.filter(l => l.status !== 'VOID');
  return round2(counted.reduce((acc, l) => acc * l.odds, 1));
}

/**
 * Estado de la combinada según sus selecciones:
 * - una perdida → perdida (aunque queden pendientes)
 * - alguna pendiente → pendiente
 * - todas anuladas → reembolsada
 * - el resto (ganadas, con alguna anulada) → ganada
 */
export function deriveParlayStatus(legs: Pick<BetLeg, 'status'>[]): BetStatus {
  if (legs.some(l => l.status === 'LOST')) return BetStatus.LOST;
  if (legs.some(l => l.status === 'PENDING')) return BetStatus.PENDING;
  if (legs.length > 0 && legs.every(l => l.status === 'VOID')) return BetStatus.REFUNDED;
  return BetStatus.WON;
}

/**
 * Aplica unas selecciones a la apuesta y recalcula estado, cuota y beneficio.
 * - Cash out y Anulada se deciden a mano: no cambian con las selecciones.
 * - La cuota solo se recalcula si hay selecciones anuladas; si no, se respeta la cuota total
 *   guardada (puede ser una cuota potenciada distinta del producto exacto).
 */
export function applyLegs(bet: Bet, legs: BetLeg[]): Bet {
  if (bet.status === BetStatus.CASH_OUT || bet.status === BetStatus.CANCELLED) return { ...bet, legs };
  const hasVoid = legs.some(l => l.status === 'VOID');
  const odds = hasVoid ? comboOdds(legs) : bet.odds;
  const status = deriveParlayStatus(legs);
  return { ...bet, legs, odds, status, profit: calculateProfit(status, odds, bet.stake, undefined, bet.freebet) };
}

/** Cambia el estado de una selección y recalcula la apuesta */
export function setLegStatus(bet: Bet, index: number, status: LegStatus): Bet {
  if (!bet.legs || !bet.legs[index]) return bet;
  const legs = bet.legs.map((l, i) => (i === index ? { ...l, status } : l));
  return applyLegs(bet, legs);
}

/**
 * Atajo de los botones ✓ / ✗ de la apuesta entera:
 * - ✓ gana todas las selecciones pendientes
 * - ✗ pierde la primera selección pendiente (si no queda ninguna, no cambia nada)
 */
export function resolveParlay(bet: Bet, result: BetStatus.WON | BetStatus.LOST): Bet {
  if (!bet.legs) return bet;
  if (result === BetStatus.WON) {
    return applyLegs(bet, bet.legs.map(l => (l.status === 'PENDING' ? { ...l, status: 'WON' as LegStatus } : l)));
  }
  const first = bet.legs.findIndex(l => l.status === 'PENDING');
  return first === -1 ? applyLegs(bet, bet.legs) : setLegStatus(bet, first, 'LOST');
}

/** Texto de las selecciones para exportar: "Real Madrid gana @1,80 (Ganada) | Barça gana @2,10 (Pendiente)" */
export function legsToText(legs: BetLeg[] | undefined): string {
  return (legs ?? [])
    .map(l => `${l.description || 'Selección'} @${l.odds.toFixed(2).replace('.', ',')} (${LEG_STATUS_LABELS[l.status]})`)
    .join(' | ');
}

/** Descripción por defecto de una combinada a partir de sus selecciones */
export function defaultParlayDescription(legs: Pick<BetLeg, 'description'>[]): string {
  const names = legs.map(l => l.description.trim()).filter(Boolean);
  if (names.length === 0) return `Combinada de ${legs.length} selecciones`;
  const joined = names.join(' + ');
  return joined.length > 120 ? `${joined.slice(0, 117)}…` : joined;
}
