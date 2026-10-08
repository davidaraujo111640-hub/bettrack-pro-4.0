import { useCallback, useEffect, useRef, useState } from 'react';
import type { Bankroll, Bet, Bookmaker } from '../../types';
import { supabase } from './supabase';
import {
  CloudData, ItemRow, Kind, Op, Snapshot,
  applyRemote, diffSnapshot, itemKey, mergeQueue, planLoad, reconcileRemote, rowsToData, sortBankrolls, stableStringify, toSnapshot,
} from './cloudSync';
import { safeSetItem } from '../utils/safeStorage';
import { DROPPED_KEY, sanitizeBankroll, sanitizeBet, sanitizeBookmaker } from '../utils/sanitize';

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
/** Altas y cambios por petición */
const UPSERT_CHUNK = 500;
/** Borrados por petición: los identificadores van en la dirección y una lista larga se rechazaría */
const DELETE_CHUNK = 100;
/** Mínimo entre dos puestas al día con la nube al volver a la app */
const REFRESH_MIN_MS = 10_000;

async function fetchAll(): Promise<ItemRow[]> {
  const rows: ItemRow[] = [];
  for (let from = 0; ; from += PAGE) {
    // Con orden fijo, las páginas no se solapan ni se saltan filas aunque cambie algo entre peticiones
    const { data, error } = await supabase.from('items').select('kind,id,data').order('kind').order('id').range(from, from + PAGE - 1);
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
  for (let i = 0; i < upserts.length; i += UPSERT_CHUNK) {
    const { error } = await supabase.from('items').upsert(upserts.slice(i, i + UPSERT_CHUNK), { onConflict: 'user_id,kind,id' });
    if (error) throw error;
  }
  const deletes = ops.filter(o => o.type === 'delete');
  for (const kind of ['bet', 'bankroll', 'bookmaker'] as Kind[]) {
    const ids = deletes.filter(o => o.kind === kind).map(o => o.id);
    for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
      const { error } = await supabase.from('items').delete().eq('kind', kind).in('id', ids.slice(i, i + DELETE_CHUNK));
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
  /** Lo que había en la nube al preguntar si se suben los datos antiguos */
  const migrateCloudRef = useRef<CloudData | null>(null);
  const queueRef = useRef<Op[]>([]);
  const flushingRef = useRef(false);
  const failuresRef = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const refreshingRef = useRef(false);
  const lastRefreshRef = useRef(0);

  // Los datos más recientes, para leerlos desde funciones asíncronas. Va el primero para que
  // el resto de efectos de este render ya vean el valor nuevo.
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; });

  const setAll = useCallback((d: CloudData) => {
    setBets(d.bets);
    setBankrolls(d.bankrolls);
    setBookmakers(d.bookmakers);
  }, [setBets, setBankrolls, setBookmakers]);

  const saveQueue = useCallback(() => {
    if (!userId) return;
    safeSetItem(queueKey(userId), JSON.stringify(queueRef.current));
  }, [userId]);

  const flush = useCallback(async () => {
    if (!userId || flushingRef.current) return;
    if (queueRef.current.length === 0) { setSyncState('synced'); return; }
    flushingRef.current = true;
    setSyncState('pending');
    const sent = queueRef.current.slice();
    try {
      await pushOps(userId, sent);
      failuresRef.current = 0;
      const done = new Set(sent);
      queueRef.current = queueRef.current.filter(o => !done.has(o));
      saveQueue();
      setSyncState(queueRef.current.length ? 'pending' : 'synced');
    } catch (e) {
      failuresRef.current += 1;
      console.warn('No se pudo sincronizar, se reintentará', e);
      setSyncState('offline');
    } finally {
      flushingRef.current = false;
    }
    if (queueRef.current.length && navigator.onLine) {
      // Espera creciente (5 s, 10 s, 20 s… hasta 80 s) para no machacar el servidor si hay un fallo persistente
      const delay = Math.min(80_000, 5_000 * 2 ** Math.min(failuresRef.current, 4));
      clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => { void flushRef.current(); }, delay);
    }
  }, [userId, saveQueue]);
  useEffect(() => { flushRef.current = flush; }, [flush]);

  const scheduleFlush = useCallback(() => {
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => { void flushRef.current(); }, 600);
  }, []);

  // 1) Al entrar: subir lo que quedó pendiente y cargar la nube
  useEffect(() => {
    snapshotRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el estado de carga sigue a la sesión (entra/sale el usuario)
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

        const plan = planLoad({ owner, localBets: local.bets.length, cloudBets: cloud.bets.length, cloudBankrolls: cloud.bankrolls.length });
        if (plan === 'migrate') {
          // Datos de antes de tener cuenta: preguntar si se suben
          migrateCloudRef.current = cloud;
          setLegacyCount(local.bets.length);
          setStatus('migrate');
          return;
        }
        if (plan === 'start-empty') {
          // Cuenta nueva: si los datos del navegador son de otra cuenta, se empieza de cero
          if (owner !== userId) setAll(emptyData());
          snapshotRef.current = {};
        } else {
          if (owner === null && local.bets.length > 0) {
            safeSetItem(LEGACY_BACKUP_KEY, JSON.stringify(local));
          }
          const bookmakers = normalizeBookmakers(cloud.bookmakers.length ? cloud.bookmakers : undefined);
          // Los bankrolls conservan el orden que ya se veía en este dispositivo
          setAll({ ...cloud, bankrolls: sortBankrolls(cloud.bankrolls, local.bankrolls), bookmakers });
          // La foto es lo que hay en la nube: lo que se haya limpiado en local se subirá solo
          snapshotRef.current = toSnapshot(cloud);
        }
        safeSetItem(OWNER_KEY, userId);
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

  // Pone al día los datos con la nube: sube lo pendiente y trae lo que se haya cambiado desde otros dispositivos
  const refresh = useCallback(async () => {
    if (!userId || !snapshotRef.current || refreshingRef.current) return;
    if (Date.now() - lastRefreshRef.current < REFRESH_MIN_MS) return;
    refreshingRef.current = true;
    lastRefreshRef.current = Date.now();
    try {
      if (queueRef.current.length) await flushRef.current();
      const cloud = rowsToData(await fetchAll());
      const snapshot = snapshotRef.current;
      if (!snapshot) return;
      const pending = new Set(queueRef.current.map(o => itemKey(o.kind, o.id)));
      const result = reconcileRemote({ local: dataRef.current, cloud, snapshot, pending });
      // La foto se actualiza antes que los datos para que el cambio no se vuelva a subir como si fuera nuestro
      snapshotRef.current = result.snapshot;
      if (result.changed) setAll(result.data);
      if (!queueRef.current.length) setSyncState('synced');
    } catch (e) {
      console.warn('No se pudo comprobar la nube', e);
    } finally {
      refreshingRef.current = false;
    }
  }, [userId, setAll]);

  // 3) Al recuperar la conexión o volver a la app: reintentar lo pendiente y traer lo nuevo de la nube
  useEffect(() => {
    if (status !== 'ready') return;
    const onOnline = () => { void flushRef.current(); void refresh(); };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(() => { if (queueRef.current.length) void flushRef.current(); }, 30000);
    if (queueRef.current.length) void flushRef.current();
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [status, refresh]);

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

        let item: unknown = null;
        if (payload.eventType === 'DELETE') {
          if (!(key in snap)) return;
          delete snap[key];
        } else {
          // Lo dañado que llegue de otro dispositivo se ignora
          const clean = row.kind === 'bet' ? sanitizeBet(row.data) : row.kind === 'bankroll' ? sanitizeBankroll(row.data) : sanitizeBookmaker(row.data);
          if (!clean) return;
          const json = stableStringify(clean);
          if (snap[key] === json) return; // es el eco de un cambio nuestro
          snap[key] = json;
          item = clean;
        }
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
      safeSetItem(LEGACY_BACKUP_KEY, JSON.stringify(dataRef.current));
      setAll(emptyData());
    }
    // La foto es lo que hay en la nube: se sube lo de este dispositivo y lo que sobre allí se retira
    snapshotRef.current = migrateCloudRef.current ? toSnapshot(migrateCloudRef.current) : {};
    migrateCloudRef.current = null;
    safeSetItem(OWNER_KEY, userId);
    setStatus('ready');
  }, [userId, setAll, emptyData]);

  /**
   * Antes de cerrar sesión: sube lo que haya pendiente. Devuelve true si ya está todo en la nube
   * (entonces se pueden borrar sin riesgo los datos de este dispositivo).
   */
  const prepareLogout = useCallback(async (): Promise<boolean> => {
    clearTimeout(flushTimer.current);
    for (let i = 0; i < 12 && queueRef.current.length > 0; i++) {
      if (!flushingRef.current) await flushRef.current();
      if (queueRef.current.length === 0 || !navigator.onLine) break;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return queueRef.current.length === 0 && !flushingRef.current;
  }, []);

  /** Borra los datos de este dispositivo y deja de sincronizar (se usa al cerrar sesión, con todo ya subido) */
  const discardLocal = useCallback(() => {
    snapshotRef.current = null; // sin foto no se compara ni se sube nada: vaciar lo local no borra nada de la nube
    clearTimeout(flushTimer.current);
    queueRef.current = [];
    const keys = ['bet_track_bets', 'bt_bankrolls', 'bt_bookmakers', OWNER_KEY, LEGACY_BACKUP_KEY, DROPPED_KEY];
    if (userId) keys.push(queueKey(userId));
    for (const key of keys) {
      try { localStorage.removeItem(key); } catch { /* sin acceso al almacenamiento */ }
    }
    setAll(emptyData());
  }, [userId, setAll, emptyData]);

  return { status, syncState, legacyCount, resolveMigration, prepareLogout, discardLocal };
}
