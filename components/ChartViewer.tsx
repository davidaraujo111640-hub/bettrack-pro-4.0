import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot } from 'recharts';
import { X, Hand } from 'lucide-react';
import {
  DetailPoint, RANGE_OPTIONS, gradientOffsets, indexFromPosition, niceTicks, pointerToChart, rangePoints, seriesStats, tickIndexes,
} from '../src/utils/chartDetail';
import { parseLocalDate } from '../src/utils/dates';

interface ChartViewerProps {
  title: string;
  /** 'profit': la curva es el beneficio acumulado · 'balance': es el saldo del bankroll */
  kind: 'profit' | 'balance';
  points: DetailPoint[];
  /** Línea de partida: 0 para el profit, el capital inicial para el saldo */
  baseline: number;
  onClose: () => void;
}

// Medidas del área de la gráfica (el cursor táctil se coloca exactamente sobre ella)
const Y_AXIS_WIDTH = 58;
const X_AXIS_HEIGHT = 26;
const MARGIN = { top: 12, right: 20, left: 0, bottom: 0 };

const eur = (n: number, signed = false) =>
  `${signed && n > 0 ? '+' : ''}${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const shortDate = (iso: string) => (iso ? parseLocalDate(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '');
const tone = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-slate-300');

function useViewportSize() {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const update = () => setSize(read());
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return size;
}

/**
 * Gráfica a pantalla completa y en horizontal, para ver la evolución operación a operación.
 * La app instalada está fijada en vertical, así que si el móvil está en vertical el contenido se gira 90°
 * (se lee girando el móvil); si ya está en horizontal, ocupa la pantalla sin más.
 * Se recorre con el dedo: un cursor propio marca la operación y muestra sus datos.
 */
const ChartViewer: React.FC<ChartViewerProps> = ({ title, kind, points, baseline, onClose }) => {
  const { w, h } = useViewportSize();
  const rotated = h > w;
  const [rangeOps, setRangeOps] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  // Cerrar con el botón, con Escape o con el botón "atrás" del móvil
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  const close = () => {
    if (window.history.state?.btChart) window.history.back();
    else onCloseRef.current();
  };
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.history.pushState({ btChart: true }, '');
    const onPop = () => onCloseRef.current();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const view = useMemo(() => rangePoints(points, rangeOps), [points, rangeOps]);
  const first = view[0]?.index ?? 0;
  const last = view[view.length - 1]?.index ?? 0;
  const hasData = view.length > 1;
  const byIndex = useMemo(() => new Map(view.map(p => [p.index, p])), [view]);
  const stats = useMemo(() => seriesStats(view), [view]);
  const offsets = useMemo(() => gradientOffsets(view.map(p => p.value), baseline), [view, baseline]);
  const ticks = useMemo(() => tickIndexes(first, last, rotated ? 7 : 9), [first, last, rotated]);

  const yDomain = useMemo<[number, number]>(() => {
    const values = [...view.map(p => p.value), baseline];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.12 || Math.max(1, Math.abs(max) * 0.05);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [view, baseline]);
  const yTicks = useMemo(() => niceTicks(yDomain[0], yDomain[1], rotated ? 4 : 6), [yDomain, rotated]);

  const active = activeIdx !== null ? byIndex.get(activeIdx) ?? null : null;
  const ranges = RANGE_OPTIONS.filter(r => r === null || points.length - 1 > r);

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el) return;
    const { x, width } = pointerToChart(e.clientX, e.clientY, el.getBoundingClientRect(), rotated);
    setActiveIdx(indexFromPosition(x, width, first, last));
  };

  // Girado: el contenedor mide (alto × ancho) de la pantalla y se gira 90° desde su esquina superior izquierda
  const frame: React.CSSProperties = rotated
    ? { position: 'fixed', top: 0, left: w, width: h, height: w, transform: 'rotate(90deg)', transformOrigin: '0 0' }
    : { position: 'fixed', top: 0, left: 0, width: w, height: h };

  const shown = active ?? null;
  const delta = (shown?.value ?? stats.current) - baseline;

  // Se dibuja en el <body>: dentro de un panel con animaciones, "pantalla completa" se mediría respecto al panel
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[130] bg-[#050505]">
      <div style={frame} className="flex flex-col bg-[#050505] text-white select-none">
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-1 shrink-0" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))' }}>
          <h2 className="text-xs font-black uppercase italic tracking-tight truncate">{title}</h2>
          <div className="ml-auto flex items-center gap-1.5">
            {ranges.map(r => (
              <button
                key={String(r)}
                type="button"
                onClick={() => { setRangeOps(r); setActiveIdx(null); }}
                aria-pressed={rangeOps === r}
                className={`px-2.5 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${rangeOps === r ? 'bg-[#e2001a] text-white' : 'bg-white/5 text-slate-400'}`}
              >
                {r === null ? 'Todo' : `Últ. ${r}`}
              </button>
            ))}
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="w-10 h-10 ml-1 rounded-full bg-white/10 flex items-center justify-center text-slate-200 active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Franja de datos: la operación tocada o, si no hay ninguna, el resumen */}
        <div className="px-4 min-h-[44px] flex items-center shrink-0 text-[11px] font-bold" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))' }}>
          {shown && shown.index > 0 ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 min-w-0">
              <span className="text-slate-400 uppercase tracking-wider">Op. {shown.index} · {shortDate(shown.date)}</span>
              <span className="text-slate-200 truncate max-w-[40vw]">{shown.description}{shown.bookmaker ? ` · ${shown.bookmaker}` : ''}</span>
              <span className={`font-black ${tone(shown.change)}`}>{eur(shown.change, true)}</span>
              <span className="text-slate-400">{kind === 'balance' ? 'Saldo' : 'Profit'} <span className={`font-black ${kind === 'profit' ? tone(shown.value) : 'text-white'}`}>{eur(shown.value, kind === 'profit')}</span></span>
              {shown.drawdown < 0 && <span className="text-slate-500">Caída desde el máx. {eur(shown.drawdown)}</span>}
            </div>
          ) : shown ? (
            <span className="text-slate-300">Inicio · {kind === 'balance' ? 'Saldo' : 'Profit'} {eur(shown.value, kind === 'profit')}</span>
          ) : hasData ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 min-w-0">
              <span className="text-slate-400">{kind === 'balance' ? 'Saldo' : 'Profit'} <span className={`font-black ${kind === 'profit' ? tone(stats.current) : 'text-white'}`}>{eur(stats.current, kind === 'profit')}</span></span>
              {kind === 'balance' && <span className={`font-black ${tone(delta)}`}>{eur(delta, true)}</span>}
              <span className="text-slate-500">Máx {eur(stats.max, kind === 'profit')}</span>
              <span className="text-slate-500">Mín {eur(stats.min, kind === 'profit')}</span>
              <span className="text-slate-500">Mejor {eur(stats.bestChange, true)}</span>
              <span className="text-slate-500">Peor {eur(stats.worstChange)}</span>
              <span className="text-slate-500">Caída máx. {eur(stats.maxDrawdown)}</span>
              <span className="text-slate-500">{stats.ops} op.</span>
            </div>
          ) : null}
        </div>

        {/* Gráfica */}
        <div className="relative flex-1 min-h-0" style={{ paddingLeft: 'env(safe-area-inset-left)', paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={view} margin={MARGIN}>
                  <defs>
                    <linearGradient id="cv-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={offsets.fill} stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset={offsets.fill} stopColor="#e2001a" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="cv-stroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset={offsets.stroke} stopColor="#10b981" />
                      <stop offset={offsets.stroke} stopColor="#e2001a" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="index"
                    domain={[first, last]}
                    ticks={ticks}
                    tickFormatter={(i: number) => (i === 0 ? 'Inicio' : shortDate(byIndex.get(i)?.date ?? ''))}
                    stroke="#525252"
                    fontSize={10}
                    fontWeight={800}
                    tickLine={false}
                    axisLine={false}
                    height={X_AXIS_HEIGHT}
                  />
                  <YAxis
                    domain={yDomain}
                    ticks={yTicks}
                    allowDataOverflow
                    width={Y_AXIS_WIDTH}
                    stroke="#525252"
                    fontSize={10}
                    fontWeight={800}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v)}€`}
                  />
                  <ReferenceLine y={baseline} stroke="#ffffff30" strokeDasharray="4 4" />
                  {active && <ReferenceLine x={active.index} stroke="#ffffff55" strokeWidth={1.5} />}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="url(#cv-stroke)"
                    strokeWidth={3}
                    fill="url(#cv-fill)"
                    fillOpacity={1}
                    baseValue={baseline}
                    isAnimationActive={false}
                    dot={view.length <= 40 ? { r: 3, fill: '#ffffff', stroke: '#050505', strokeWidth: 1 } : false}
                    activeDot={false}
                  />
                  {active && <ReferenceDot x={active.index} y={active.value} r={7} fill="#ffffff" stroke="#050505" strokeWidth={3} />}
                </AreaChart>
              </ResponsiveContainer>

              {/* Capa táctil exactamente sobre el área de dibujo: recorre las operaciones con el dedo */}
              <div
                ref={plotRef}
                data-testid="chart-touch-layer"
                className="absolute cursor-crosshair"
                style={{ left: MARGIN.left + Y_AXIS_WIDTH, right: MARGIN.right, top: MARGIN.top, bottom: X_AXIS_HEIGHT + MARGIN.bottom, touchAction: 'none' }}
                onPointerDown={(e) => {
                  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura: el cursor sigue funcionando al moverse dentro */ }
                  handlePointer(e);
                }}
                onPointerMove={handlePointer}
              />
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              Todavía no hay operaciones cerradas
            </div>
          )}
          {hasData && !active && (
            <div className="absolute bottom-8 right-6 flex items-center gap-1.5 text-[10px] font-bold text-slate-600 pointer-events-none">
              <Hand size={12} /> Desliza el dedo sobre la gráfica
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChartViewer;
