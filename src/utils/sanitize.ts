import { Bankroll, Bet, BetLeg, BetStatus, Bookmaker, LegStatus } from '../../types';
import { safeSetItem } from './safeStorage';

/** Donde se guarda, por si hiciera falta, lo que se descarta por estar dañado */
export const DROPPED_KEY = 'bt_dropped_items';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFinite_ = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const STATUSES = new Set<string>(Object.values(BetStatus));
const LEG_STATUSES = new Set<string>(['PENDING', 'WON', 'LOST', 'VOID']);

/** "2026-10-01" (o "2026-10-01T12:00:00Z") → "2026-10-01"; null si no es una fecha */
function normalizeDate(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  if (m && !Number.isNaN(new Date(m[1]).getTime())) return m[1];
  return null;
}

function sanitizeLegs(raw: unknown): BetLeg[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const legs: BetLeg[] = [];
  for (const item of raw) {
    if (!isObject(item) || !isFinite_(item.odds) || item.odds <= 0) return undefined;
    const status = LEG_STATUSES.has(str(item.status)) ? (item.status as LegStatus) : 'PENDING';
    legs.push({ description: str(item.description), odds: item.odds, status });
  }
  return legs.length >= 2 ? legs : undefined;
}

/**
 * Deja una apuesta lista para usarse: rellena con valores por defecto lo que falta de poca importancia
 * (casa, deporte, descripción) y descarta (null) las que no tienen lo imprescindible: identificador,
 * fecha válida, cuota, importe, beneficio y estado.
 */
export function sanitizeBet(raw: unknown): Bet | null {
  if (!isObject(raw)) return null;
  const date = normalizeDate(raw.date);
  if (typeof raw.id !== 'string' || !raw.id || !date) return null;
  if (!isFinite_(raw.odds) || raw.odds <= 0 || !isFinite_(raw.stake) || raw.stake < 0 || !isFinite_(raw.profit)) return null;
  if (typeof raw.status !== 'string' || !STATUSES.has(raw.status)) return null;
  const legs = sanitizeLegs(raw.legs);
  return {
    id: raw.id,
    bankrollId: str(raw.bankrollId, 'default') || 'default',
    date,
    bookmaker: str(raw.bookmaker),
    sport: str(raw.sport, 'Otros') as Bet['sport'],
    odds: raw.odds,
    stake: raw.stake,
    status: raw.status as BetStatus,
    profit: raw.profit,
    description: str(raw.description),
    ...(raw.freebet === true ? { freebet: true } : {}),
    ...(legs ? { legs } : {}),
  };
}

export function sanitizeBankroll(raw: unknown): Bankroll | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id,
    name: str(raw.name, 'Bankroll') || 'Bankroll',
    initialCapital: isFinite_(raw.initialCapital) && raw.initialCapital >= 0 ? raw.initialCapital : 0,
    color: str(raw.color, '#e2001a'),
    ...(raw.archived === true ? { archived: true } : {}),
    ...(isFinite_(raw.createdAt) ? { createdAt: raw.createdAt } : {}),
  };
}

export function sanitizeBookmaker(raw: unknown): Bookmaker | null {
  if (!isObject(raw) || typeof raw.id !== 'string' || !raw.id || typeof raw.name !== 'string' || !raw.name.trim()) return null;
  return { id: raw.id, name: raw.name, icon: str(raw.icon), enabled: raw.enabled !== false };
}

export interface Sanitized<T> {
  items: T[];
  dropped: unknown[];
}

/** Aplica la limpieza a una lista; separa lo válido de lo descartado */
export function sanitizeList<T>(raw: unknown, sanitize: (item: unknown) => T | null): Sanitized<T> {
  if (!Array.isArray(raw)) return { items: [], dropped: [] };
  const items: T[] = [];
  const dropped: unknown[] = [];
  for (const entry of raw) {
    const clean = sanitize(entry);
    if (clean) items.push(clean);
    else dropped.push(entry);
  }
  return { items, dropped };
}

/**
 * Lee del almacenamiento una lista guardada como JSON y la limpia. Si había elementos dañados los
 * aparta en DROPPED_KEY (para poder recuperarlos) en vez de dejar que rompan la app.
 */
export function loadSanitized<T>(rawJson: string | null, sanitize: (item: unknown) => T | null): T[] {
  if (!rawJson) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(rawJson); } catch { return []; }
  const { items, dropped } = sanitizeList(parsed, sanitize);
  if (dropped.length > 0) {
    console.warn(`Se han descartado ${dropped.length} elementos dañados (guardados en ${DROPPED_KEY})`);
    safeSetItem(DROPPED_KEY, JSON.stringify(dropped.slice(0, 200)));
  }
  return items;
}
