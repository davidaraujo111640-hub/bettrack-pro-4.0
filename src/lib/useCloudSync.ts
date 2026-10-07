import { useCallback, useEffect, useRef, useState } from 'react';
import type { Bankroll, Bet, Bookmaker } from '../../types';
import { supabase } from './supabase';
import {
  CloudData, ItemRow, Kind, Op, Snapshot,
  applyRemote, diffSnapshot, itemKey, mergeQueue, rowsToData, stableStringify, toSnapshot,
} from './cloudSync';

/**
 * - loading: leyendo la nube
 * - migrate: la nube está vacía y en este navegador hay apuestas de antes de tener cuenta
 * - needs-online: primera vez en este dispositivo y sin conexión
 * - ready: funcionando
 */
export type CloudStatus = 'idle' | 'loading' | 'migrate' | 'needs-online' | 'ready';
/** synced: todo subido · pending: subiendo · offline: sin conexión, los cambios esperan */
export type SyncState = 'synced' | 'pending' | 'offline';

/** Usuario dueño de los datos guardados en este navegador */
const OWNER_KEY = 'bt_cloud_owner';
/** Copia de los datos de antes de tener cuenta, por si se decide no subirlos */
const LEGACY_BACKUP_KEY = 'bt_local_backup';
const queueKey = (userId: string) => `bt_sync_queue:${userId}`;

const PAGE = 1000;
const CHUNK = 500;

async function fetchAll(): Promise<ItemRow[]> {
  const rows: ItemRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('items').select('kind,id,data').range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data as ItemRow[]));
    if (data.length < PAGE) return rows;
  }
}

async function pushOps(userId: string, ops: Op[]): Promise<void> {
  const now = new Date().toISOString();
  const upserts = ops.filter(o => o.type === 'upsert').map(o => ({
    user_id: userId, kind: o.kind, id: o.id, data: (o as { data: unknown }).data, updated_at: now,
  }));
  for (let i = 0; i < upserts.length; i += CHUNK) {
    const { error } = await supabase.from('items').upsert(upserts.slice(i, i + CHUNK), { onConflict: 'user_id,kind,id' });
    if (error) throw error;
  }
  const deletes = ops.filter(o => o.type === 'delete');
  for (const kind of ['bet', 'bankroll', 'bookmaker'] as Kind[]) {
    const ids = deletes.filter(o => o.kind === kind).map(o => o.id);
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await supabase.from('items').delete().eq('kind', kind).in('id', ids.slice(i, i + CHUNK));
      if (error) throw error;
    }
  }
}

function readQueue(userId: string): Op[] {
  try { return JSON.parse(localStorage.getItem(queueKey(userId)) || '[]'); } catch { return []; }
}

interface Options {
  userId: string | null;
  data: CloudData;
  setBets: React.Dispatch<React.SetStateAction<Bet[]>>;
  setBankrolls: React.Dispatch<React.SetStateAction<Bankroll[]>>;
  setBookmakers: React.Dispatch<React.SetStateAction<Bookmaker[]>>;
  /** Limpia la lista de casas (añade nuevas por defecto, iconos oficiales…) */
  normalizeBookmakers: (list: unknown) => Bookmaker[];
  /** Datos de una cuenta recién creada */
  emptyData: () => CloudData;
}

export function useCloudSync({ userId, data, setBets, setBankrolls, setBookmakers, normalizeBookmakers, emptyData }: Options) {
  const [status, setStatus] = useState<CloudStatus>('idle');
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [legacyCount, setLegacyCount] = useState(0);

  const snapshotRef = useRef<Snapshot | null>(null);
  const queueRef = useRef<Op[]>([]);
  const flushingRef = useRef(false);
  const flushTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dataRef = useRef(data);
  dataRef.current = data;

  const setAll = useCallback((d: CloudData) => {
    setBets(d.bets);
    setBankrolls(d.bankrolls);
    setBookmakers(d.bookmakers);
  }, [setBets, setBankrolls, setBookmakers]);

  const saveQueue = useCallback(() => {
    if (!userId) return;
    try { localStorage.setItem(queueKey(userId), JSON.stringify(queueRef.current)); } catch { /* sin espacio: queda en memoria */ }
  }, [userId]);

  const flush = useCallback(async () => {
    if (!userId || flushingRef.current) return;
    if (queueRef.current.length === 0) { setSyncState('synced'); return; }
    flushingRef.current = true;
    setSyncState('pending');
    const sent = queueRef.current.slice();
    try {
      await pushOps(userId, sent);
      const done = new Set(sent);
      queueRef.current = queueRef.current.filter(o => !done.has(o));
      saveQueue();
      setSyncState(queueRef.current.length ? 'pending' : 'synced');
    } catch (e) {
      console.warn('No se pudo sincronizar, se reintentará', e);
      setSyncState('offline');
    } finally {
      flushingRef.current = false;
    }
    if (queueRef.current.length && navigator.onLine) flushTimer.current = setTimeout(flush, 5000);
  }, [userId, saveQueue]);

  const scheduleFlush = useCallback(() => {
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 600);
  }, [flush]);

  // 1) Al entrar: subir lo que quedó pendiente y cargar la nube
  useEffect(() => {
    snapshotRef.current = null;
    if (!userId) { setStatus('idle'); return; }
    let cancelled = false;
    setStatus('loading');
    queueRef.current = readQueue(userId);

    (async () => {
      const owner = localStorage.getItem(OWNER_KEY);
      const local = dataRef.current;
      try {
        if (queueRef.current.length) await pushOps(userId, queueRef.current).then(() => { queueRef.current = []; saveQueue(); });
        const cloud = rowsToData(await fetchAll());
        if (cancelled) return;

        const cloudEmpty = cloud.bets.length === 0 && cloud.bankrolls.length === 0;
        if (cloudEmpty) {
          if (owner === null && local.bets.length > 0) {
            // Datos de antes de tener cuenta: preguntar si se suben
            setLegacyCount(local.bets.length);
            setStatus('migrate');
            return;
          }
          // Cuenta nueva: si los datos del navegador son de otra cuenta, se empieza de cero
          if (owner !== userId) setAll(emptyData());
          snapshotRef.current = {};
        } else {
          if (owner === null && local.bets.length > 0) {
            try { localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(local)); } catch { /* sin espacio */ }
          }
          const bookmakers = normalizeBookmakers(cloud.bookmakers.length ? cloud.bookmakers : undefined);
          setAll({ ...cloud, bookmakers });
          // La foto es lo que hay en la nube: lo que se haya limpiado en local se subirá solo
          snapshotRef.current = toSnapshot(cloud);
        }
        localStorage.setItem(OWNER_KEY, userId);
        setSyncState('synced');
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        console.warn('Sin conexión con la nube', e);
        if (owner === userId) {
          // Mismo usuario: se trabaja con la copia del navegador y se sube al volver la conexión
          snapshotRef.current = toSnapshot(local);
          setSyncState('offline');
          setStatus('ready');
        } else {
          setStatus('needs-online');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [userId, setAll, emptyData, normalizeBookmakers, saveQueue]);

  // 2) Cada cambio en los datos → diferencias → cola → subir
  useEffect(() => {
    if (status !== 'ready' || !snapshotRef.current) return;
    const { ops, snapshot } = diffSnapshot(snapshotRef.current, data);
    if (!ops.length) return;
    snapshotRef.current = snapshot;
    queueRef.current = mergeQueue(queueRef.current, ops);
    saveQueue();
    setSyncState('pending');
    scheduleFlush();
  }, [data, status, saveQueue, scheduleFlush]);

  // 3) Al recuperar la conexión, reintentar
  useEffect(() => {
    if (status !== 'ready') return;
    const retry = () => flush();
    window.addEventListener('online', retry);
    const interval = setInterval(() => { if (queueRef.current.length) flush(); }, 30000);
    if (queueRef.current.length) flush();
    return () => { window.removeEventListener('online', retry); clearInterval(interval); };
  }, [status, flush]);

  // 4) Cambios hechos en otros dispositivos, en tiempo real
  useEffect(() => {
    if (status !== 'ready' || !userId) return;
    const channel = supabase
      .channel(`items-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${userId}` }, payload => {
        const snap = snapshotRef.current;
        if (!snap) return;
        const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Partial<ItemRow>;
        if (!row.kind || !row.id) return;
        const key = itemKey(row.kind, row.id);
        // Si este elemento tiene cambios propios sin subir, mandan los propios
        if (queueRef.current.some(o => itemKey(o.kind, o.id) === key)) return;

        if (payload.eventType === 'DELETE') {
          if (!(key in snap)) return;
          delete snap[key];
        } else {
          const json = stableStringify(row.data);
          if (snap[key] === json) return; // es el eco de un cambio nuestro
          snap[key] = json;
        }
        const item = payload.eventType === 'DELETE' ? null : row.data;
        if (row.kind === 'bet') setBets(l => applyRemote(l, row.id!, item as Bet | null));
        else if (row.kind === 'bankroll') setBankrolls(l => applyRemote(l, row.id!, item as Bankroll | null));
        else setBookmakers(l => applyRemote(l, row.id!, item as Bookmaker | null).sort((a, b) => a.name.localeCompare(b.name)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [status, userId, setBets, setBankrolls, setBookmakers]);

  /** Respuesta a "¿Subir tus apuestas a tu cuenta?" */
  const resolveMigration = useCallback((upload: boolean) => {
    if (!userId) return;
    if (!upload) {
      try { localStorage.setItem(LEGACY_BACKUP_KEY, JSON.stringify(dataRef.current)); } catch { /* sin espacio */ }
      setAll(emptyData());
    }
    // Foto vacía: todo lo que haya ahora se sube
    snapshotRef.current = {};
    localStorage.setItem(OWNER_KEY, userId);
    setStatus('ready');
  }, [userId, setAll, emptyData]);

  return { status, syncState, legacyCount, resolveMigration };
}
