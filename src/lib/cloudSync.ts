import type { Bankroll, Bet, Bookmaker } from '../../types';
import { sanitizeBankroll, sanitizeBet, sanitizeBookmaker } from '../utils/sanitize';

/**
 * Sincronización con la nube (Supabase, tabla "items").
 *
 * La app sigue trabajando con sus listas en memoria (y una copia en el navegador para
 * abrir al instante y funcionar sin conexión). Cada vez que cambian, se compara con la
 * última foto de lo que hay en la nube y solo se envían las diferencias. Si no hay
 * conexión, los cambios esperan en una cola guardada en el navegador.
 */

export type Kind = 'bet' | 'bankroll' | 'bookmaker';

export interface CloudData {
  bets: Bet[];
  bankrolls: Bankroll[];
  bookmakers: Bookmaker[];
}

export type Op =
  | { type: 'upsert'; kind: Kind; id: string; data: unknown }
  | { type: 'delete'; kind: Kind; id: string };

/** Foto de lo que hay en la nube: "kind:id" → JSON estable del objeto */
export type Snapshot = Record<string, string>;

export interface ItemRow {
  kind: Kind;
  id: string;
  data: unknown;
}

const LISTS: [Kind, keyof CloudData][] = [['bet', 'bets'], ['bankroll', 'bankrolls'], ['bookmaker', 'bookmakers']];

export const itemKey = (kind: Kind, id: string) => `${kind}:${id}`;

/**
 * JSON con las claves ordenadas y sin campos undefined. Postgres (jsonb) reordena las
 * claves, así que sin esto un objeto igual parecería distinto al volver de la nube.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(v => (v === undefined ? 'null' : stableStringify(v))).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

export function toSnapshot(data: CloudData): Snapshot {
  const snap: Snapshot = {};
  for (const [kind, list] of LISTS) {
    for (const item of data[list] as { id: string }[]) snap[itemKey(kind, item.id)] = stableStringify(item);
  }
  return snap;
}

/** Diferencias entre la foto de la nube y los datos actuales */
export function diffSnapshot(prev: Snapshot, data: CloudData): { ops: Op[]; snapshot: Snapshot } {
  const next = toSnapshot(data);
  const ops: Op[] = [];
  for (const [kind, list] of LISTS) {
    for (const item of data[list] as { id: string }[]) {
      const key = itemKey(kind, item.id);
      if (prev[key] !== next[key]) ops.push({ type: 'upsert', kind, id: item.id, data: JSON.parse(next[key]) });
    }
  }
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      const i = key.indexOf(':');
      ops.push({ type: 'delete', kind: key.slice(0, i) as Kind, id: key.slice(i + 1) });
    }
  }
  return { ops, snapshot: next };
}

/** Añade operaciones a la cola dejando solo la última de cada elemento */
export function mergeQueue(queue: Op[], ops: Op[]): Op[] {
  const touched = new Set(ops.map(o => itemKey(o.kind, o.id)));
  return [...queue.filter(o => !touched.has(itemKey(o.kind, o.id))), ...ops];
}

/** Convierte las filas de la nube en las listas de la app (apuestas de más reciente a más antigua) */
export function rowsToData(rows: ItemRow[]): CloudData {
  const data: CloudData = { bets: [], bankrolls: [], bookmakers: [] };
  let dropped = 0;
  for (const row of rows) {
    // Lo dañado se descarta aquí para que un dato roto de la nube no pueda tumbar la app
    if (row.kind === 'bet') { const x = sanitizeBet(row.data); if (x) data.bets.push(x); else dropped++; }
    else if (row.kind === 'bankroll') { const x = sanitizeBankroll(row.data); if (x) data.bankrolls.push(x); else dropped++; }
    else if (row.kind === 'bookmaker') { const x = sanitizeBookmaker(row.data); if (x) data.bookmakers.push(x); else dropped++; }
  }
  if (dropped > 0) console.warn(`Se han ignorado ${dropped} elementos dañados de la nube`);
  data.bets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return data;
}

/** Aplica a una lista un cambio llegado de otro dispositivo */
export function applyRemote<T extends { id: string }>(list: T[], id: string, item: T | null): T[] {
  const idx = list.findIndex(x => x.id === id);
  if (item === null) return idx === -1 ? list : list.filter(x => x.id !== id);
  if (idx === -1) return [item, ...list];
  const copy = list.slice();
  copy[idx] = item;
  return copy;
}

export type LoadPlan = 'migrate' | 'start-empty' | 'use-cloud';

/**
 * Qué hacer al entrar con una cuenta, según lo que hay en la nube y en este navegador.
 * - migrate: hay apuestas de antes de tener cuenta y la nube aún no tiene ninguna: preguntar si se suben.
 *   Se mira solo si hay APUESTAS en la nube: un bankroll vacío creado al estrenar la cuenta
 *   (por ejemplo, abriéndola antes en otro navegador) no debe impedir recuperar las de este.
 * - start-empty: cuenta sin ningún dato.
 * - use-cloud: la nube manda.
 */
export function planLoad(p: { owner: string | null; localBets: number; cloudBets: number; cloudBankrolls: number }): LoadPlan {
  if (p.owner === null && p.localBets > 0 && p.cloudBets === 0) return 'migrate';
  if (p.cloudBets === 0 && p.cloudBankrolls === 0) return 'start-empty';
  return 'use-cloud';
}

/**
 * Pone al día los datos locales con lo que hay ahora en la nube (por ejemplo, al volver a la app
 * tras estar en segundo plano, cuando el canal en tiempo real pudo perder cambios).
 * - Lo que tiene cambios propios pendientes de subir manda lo local (no se pisa ni se "resucita" lo borrado).
 * - El resto se iguala con la nube: cambios, altas y borrados hechos desde otros dispositivos.
 * Devuelve los datos nuevos, la foto actualizada y si ha cambiado algo.
 */
export function reconcileRemote(p: { local: CloudData; cloud: CloudData; snapshot: Snapshot; pending: Set<string> }): { data: CloudData; snapshot: Snapshot; changed: boolean } {
  const merge = <T extends { id: string }>(kind: Kind, local: T[], cloud: T[], addNewAtStart: boolean): T[] => {
    const cloudById = new Map(cloud.map(x => [x.id, x]));
    const localIds = new Set(local.map(x => x.id));
    const result: T[] = [];
    for (const item of local) {
      const key = itemKey(kind, item.id);
      if (p.pending.has(key)) { result.push(item); continue; }
      const remote = cloudById.get(item.id);
      if (remote) result.push(stableStringify(remote) === stableStringify(item) ? item : remote);
      else if (!(key in p.snapshot)) result.push(item); // algo local que aún no consta en la nube: se conserva
      // si estaba en la foto y ya no está en la nube, se borró desde otro dispositivo
    }
    const added = cloud.filter(x => !localIds.has(x.id) && !p.pending.has(itemKey(kind, x.id)));
    return addNewAtStart ? [...added, ...result] : [...result, ...added];
  };

  const bets = merge('bet', p.local.bets, p.cloud.bets, true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const bankrolls = merge('bankroll', p.local.bankrolls, p.cloud.bankrolls, false);
  const bookmakers = merge('bookmaker', p.local.bookmakers, p.cloud.bookmakers, false)
    .sort((a, b) => a.name.localeCompare(b.name));

  const data: CloudData = { bets, bankrolls, bookmakers };
  const before = toSnapshot(p.local);
  const after = toSnapshot(data);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const orderChanged = bets.length !== p.local.bets.length || bets.some((b, i) => b !== p.local.bets[i]);
  const changed = orderChanged || [...keys].some(k => before[k] !== after[k]);
  return { data, snapshot: after, changed };
}

/** Ordena una lista según el orden de otra de referencia; lo que no está en la referencia va al final */
export function orderLike<T extends { id: string }>(list: T[], reference: T[]): T[] {
  const position = new Map(reference.map((x, i) => [x.id, i]));
  return [...list].sort((a, b) => (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.id) ?? Number.MAX_SAFE_INTEGER));
}

/**
 * Orden de los bankrolls: primero los más antiguos. Los que no tienen fecha de creación (anteriores a esta versión)
 * van primero y conservan el orden que ya se veía en el dispositivo.
 */
export function sortBankrolls(list: Bankroll[], reference: Bankroll[]): Bankroll[] {
  const position = new Map(reference.map((b, i) => [b.id, i]));
  const at = (b: Bankroll) => position.get(b.id) ?? Number.MAX_SAFE_INTEGER;
  return [...list].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || at(a) - at(b) || a.id.localeCompare(b.id));
}
