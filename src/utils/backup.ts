import { Bet, BetStatus, BetLeg, LegStatus, Bankroll, Bookmaker } from '../../types';
import { calculateRoi, calculateYield, round2, realStake } from './betMath';

export const BACKUP_VERSION = 2;

export interface BackupData {
  bets: Bet[];
  bankrolls: Bankroll[];
  /** Las copias antiguas (versión 1) no incluían las casas de apuestas */
  bookmakers?: Bookmaker[];
}

interface StatsSummary {
  apuestas: number;
  pendientes: number;
  beneficio: number;
  totalApostado: number;
  yield: number;
  roi: number;
  acierto: number;
}

function summarize(bets: Bet[], initialCapital: number): StatsSummary {
  const closed = bets.filter(b => b.status !== BetStatus.PENDING);
  const profit = round2(closed.reduce((acc, b) => acc + b.profit, 0));
  const staked = round2(closed.reduce((acc, b) => acc + realStake(b), 0));
  const won = closed.filter(b => b.status === BetStatus.WON || (b.status === BetStatus.CASH_OUT && b.profit > 0)).length;
  return {
    apuestas: bets.length,
    pendientes: bets.length - closed.length,
    beneficio: profit,
    totalApostado: staked,
    yield: round2(calculateYield(profit, staked)),
    roi: round2(calculateRoi(profit, initialCapital)),
    acierto: closed.length > 0 ? round2((won / closed.length) * 100) : 0,
  };
}

/**
 * Copia de seguridad completa: todos los datos necesarios para restaurar la app,
 * más un resumen de estadísticas (solo informativo, no se usa al importar).
 */
export function buildBackup(data: Required<BackupData>, now = new Date()) {
  const activeCapital = data.bankrolls.filter(b => !b.archived).reduce((acc, b) => acc + b.initialCapital, 0);
  return {
    app: 'BetTrack',
    version: BACKUP_VERSION,
    exportDate: now.toISOString(),
    resumen: {
      global: summarize(data.bets, activeCapital),
      porBankroll: data.bankrolls.map(b => ({
        bankroll: b.name,
        archivado: !!b.archived,
        capitalInicial: b.initialCapital,
        ...summarize(data.bets.filter(bet => bet.bankrollId === b.id), b.initialCapital),
      })),
    },
    bankrolls: data.bankrolls,
    bets: data.bets,
    bookmakers: data.bookmakers,
  };
}

export function downloadBackup(data: Required<BackupData>): void {
  const backup = buildBackup(data);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BetTrack_Backup_${backup.exportDate.split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const VALID_STATUSES = new Set<string>(Object.values(BetStatus));
const VALID_LEG_STATUSES = new Set<string>(['PENDING', 'WON', 'LOST', 'VOID']);

/** Lee las selecciones de una combinada. Devuelve null si alguna está dañada. */
function parseLegs(raw: unknown): BetLeg[] | null {
  if (!Array.isArray(raw)) return null;
  const legs: BetLeg[] = [];
  for (const item of raw) {
    if (!isObject(item) || typeof item.odds !== 'number' || !(item.odds > 0)) return null;
    if (typeof item.status !== 'string' || !VALID_LEG_STATUSES.has(item.status)) return null;
    legs.push({ description: typeof item.description === 'string' ? item.description : '', odds: item.odds, status: item.status as LegStatus });
  }
  return legs;
}

function parseBet(raw: unknown): Bet | null {
  if (!isObject(raw)) return null;
  const { id, bankrollId, date, odds, stake, status, profit } = raw;
  if (typeof id !== 'string' || typeof bankrollId !== 'string' || typeof date !== 'string') return null;
  if (typeof odds !== 'number' || typeof stake !== 'number' || typeof profit !== 'number') return null;
  if (typeof status !== 'string' || !VALID_STATUSES.has(status)) return null;
  let legs: BetLeg[] | undefined;
  if (raw.legs !== undefined) {
    const parsed = parseLegs(raw.legs);
    if (!parsed) return null;
    if (parsed.length > 0) legs = parsed;
  }
  return {
    id,
    bankrollId,
    date,
    odds,
    stake,
    profit,
    status: status as BetStatus,
    bookmaker: typeof raw.bookmaker === 'string' ? raw.bookmaker : '',
    sport: (typeof raw.sport === 'string' ? raw.sport : 'Otros') as Bet['sport'],
    description: typeof raw.description === 'string' ? raw.description : '',
    ...(raw.freebet === true ? { freebet: true } : {}),
    ...(legs ? { legs } : {}),
  };
}

function parseBankroll(raw: unknown): Bankroll | null {
  if (!isObject(raw)) return null;
  const { id, name, initialCapital } = raw;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof initialCapital !== 'number') return null;
  return {
    id,
    name,
    initialCapital,
    color: typeof raw.color === 'string' ? raw.color : '#e2001a',
    archived: raw.archived === true,
  };
}

function parseBookmaker(raw: unknown): Bookmaker | null {
  if (!isObject(raw)) return null;
  const { id, name } = raw;
  if (typeof id !== 'string' || typeof name !== 'string') return null;
  return {
    id,
    name,
    icon: typeof raw.icon === 'string' ? raw.icon : '',
    enabled: raw.enabled !== false,
  };
}

export type ParseBackupResult = { ok: true; data: BackupData } | { ok: false; error: string };

/** Lee y valida un archivo de copia de seguridad (versión actual o antigua). */
export function parseBackup(text: string): ParseBackupResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es una copia de seguridad válida (no se puede leer).' };
  }

  if (!isObject(json) || !Array.isArray(json.bets) || !Array.isArray(json.bankrolls)) {
    return { ok: false, error: 'El archivo no tiene el formato de copia de seguridad de BetTrack.' };
  }
  if (typeof json.version === 'number' && json.version > BACKUP_VERSION) {
    return { ok: false, error: 'Esta copia es de una versión más nueva de la app.' };
  }

  const bets: Bet[] = [];
  for (let i = 0; i < json.bets.length; i++) {
    const bet = parseBet(json.bets[i]);
    if (!bet) return { ok: false, error: `La apuesta nº ${i + 1} de la copia está incompleta o dañada.` };
    bets.push(bet);
  }

  const bankrolls: Bankroll[] = [];
  for (let i = 0; i < json.bankrolls.length; i++) {
    const bankroll = parseBankroll(json.bankrolls[i]);
    if (!bankroll) return { ok: false, error: `El bankroll nº ${i + 1} de la copia está incompleto o dañado.` };
    bankrolls.push(bankroll);
  }
  if (bankrolls.length === 0) {
    return { ok: false, error: 'La copia no contiene ningún bankroll.' };
  }

  let bookmakers: Bookmaker[] | undefined;
  if (Array.isArray(json.bookmakers)) {
    bookmakers = json.bookmakers.map(parseBookmaker).filter((b): b is Bookmaker => b !== null);
  }

  return { ok: true, data: { bets, bankrolls, bookmakers } };
}
