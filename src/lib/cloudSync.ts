import type { Bankroll, Bet, Bookmaker } from '../../types';

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
  for (const row of rows) {
    const list = LISTS.find(([k]) => k === row.kind)?.[1];
    if (list && row.data && typeof row.data === 'object') (data[list] as unknown[]).push(row.data);
  }
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
