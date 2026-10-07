import type { Bankroll, Bet, Bookmaker } from '../../types';

export interface LocalData {
  bets: Bet[];
  bankrolls: Bankroll[];
  bookmakers: Bookmaker[];
}

type StorageLike = Pick<Storage, 'length' | 'key' | 'getItem'>;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const looksLikeBet = (v: unknown) => isObject(v) && 'odds' in v && 'stake' in v;
const looksLikeBankroll = (v: unknown) => isObject(v) && 'initialCapital' in v && 'name' in v;
const looksLikeBookmaker = (v: unknown) => isObject(v) && 'name' in v && 'enabled' in v;

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Busca en el almacenamiento del navegador los datos de la app, aunque estén en un
 * formato o con un nombre antiguo: se reconocen por la forma de los objetos (una apuesta
 * tiene cuota e importe, un bankroll tiene capital inicial...). Se queda con la lista más
 * larga de cada tipo. Sirve para rescatar datos cuando la app no puede iniciar sesión.
 */
export function readLocalData(storage: StorageLike): LocalData {
  const found: LocalData = { bets: [], bankrolls: [], bookmakers: [] };

  const consider = (list: unknown[]) => {
    if (list.length === 0) return;
    if (list.every(looksLikeBet) && list.length > found.bets.length) found.bets = list as Bet[];
    else if (list.every(looksLikeBankroll) && list.length > found.bankrolls.length) found.bankrolls = list as Bankroll[];
    else if (list.every(looksLikeBookmaker) && list.length > found.bookmakers.length) found.bookmakers = list as Bookmaker[];
  };

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || key.startsWith('bt_sync_queue')) continue;
    const value = parse(storage.getItem(key));
    if (Array.isArray(value)) consider(value);
    else if (isObject(value)) {
      // Copias guardadas como un objeto {bets, bankrolls, bookmakers}
      for (const field of ['bets', 'bankrolls', 'bookmakers']) {
        const inner = value[field];
        if (Array.isArray(inner)) consider(inner);
      }
    }
  }
  return found;
}
