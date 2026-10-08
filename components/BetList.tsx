import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Bet, BetStatus, Bankroll, Bookmaker } from '../types';
import { getSportIcon } from '../src/utils/icons';
import { calculateYield, calculateProfit, parseDecimal, realStake, getPayout } from '../src/utils/betMath';
import { downloadBetsCsv } from '../src/utils/exportCsv';
import { BookmakerTag } from '../src/utils/bookmakerTag';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Columns, ChevronDown, Trash2, Edit3, Check, X, AlertTriangle, Calendar, Activity, Download, FileSpreadsheet, Banknote } from 'lucide-react';

interface BetListProps {
  bets: Bet[];
  /** Todas las apuestas, sin filtrar por bankroll (para exportar todas a Excel) */
  allBets: Bet[];
  /** Casas configuradas (para usar la imagen que el usuario haya subido a cada una) */
  bookmakers: Bookmaker[];
  bankrolls: Bankroll[];
  activeBankrollName: string;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: BetStatus, profit?: number) => void;
  onEdit: (bet: Bet) => void;
  /** Apuesta recién guardada o editada: se resalta un momento con el destello */
  justSavedId?: string | null;
}

const formatStatusText = (status: BetStatus): string => {
  switch (status) {
    case BetStatus.WON: return 'Ganada';
    case BetStatus.LOST: return 'Perdida';
    case BetStatus.PENDING: return 'Pendiente';
    case BetStatus.CASH_OUT: return 'CASH OUT';
    case BetStatus.REFUNDED: return 'REEMBOLSADA';
    case BetStatus.CANCELLED: return 'ANULADA';
    default: return status;
  }
};

const getStatusStyle = (status: BetStatus) => {
  switch (status) {
    case BetStatus.WON: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case BetStatus.LOST: return 'bg-[#e2001a]/10 text-[#e2001a] border border-[#e2001a]/20';
    case BetStatus.CASH_OUT: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    case BetStatus.REFUNDED: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case BetStatus.CANCELLED: return 'bg-zinc-950 text-zinc-600 border border-zinc-800';
    default: return 'bg-zinc-400/10 text-zinc-300 border border-zinc-400/20';
  }
};

// Color de cada estado (r, g, b) para el fondo, la franja lateral, el borde y la sombra de la tarjeta
const STATUS_RGB: Record<BetStatus, string> = {
  [BetStatus.PENDING]: '161, 161, 170',  // activa: gris
  [BetStatus.WON]: '16, 185, 129',       // ganada: verde
  [BetStatus.LOST]: '226, 0, 26',        // perdida: rojo
  [BetStatus.CASH_OUT]: '234, 179, 8',   // cash out: amarillo
  [BetStatus.REFUNDED]: '59, 130, 246',  // reembolsada: azul
  [BetStatus.CANCELLED]: '39, 39, 42',  // anulada: casi negro
};

/** Estilo de la tarjeta según su estado (en línea, para que no lo tape el fondo de .glass-panel). */
const getRowStyle = (status: BetStatus): React.CSSProperties => {
  const c = STATUS_RGB[status] ?? STATUS_RGB[BetStatus.CANCELLED];
  return {
    background: `linear-gradient(90deg, rgba(${c}, 0.16) 0%, rgba(${c}, 0.05) 45%, rgba(18, 18, 18, 0.85) 100%)`,
    borderColor: `rgba(${c}, 0.28)`,
    boxShadow: `inset 3px 0 0 rgba(${c}, 0.9), 0 0 24px rgba(${c}, 0.06)`,
  };
};

interface BetRowProps {
  bet: Bet;
  visibleColumns: {
    sportIcon: boolean;
    bookmaker: boolean;
    date: boolean;
    odds: boolean;
    stake: boolean;
    profit: boolean;
    actions: boolean;
  };
  onUpdateStatus: (id: string, status: BetStatus, profit?: number) => void;
  onEdit: (bet: Bet) => void;
  onDeleteRequest: (id: string) => void;
  onCashOutRequest: (bet: Bet) => void;
  /** Imagen de la casa guardada en Casas (puede ser una subida por el usuario) */
  bookmakerIcon?: string;
  /** Esta apuesta se acaba de guardar o editar */
  justSaved?: boolean;
}

const CELEBRATION_MS = 1500;

const BetRow: React.FC<BetRowProps> = React.memo(({ bet, visibleColumns, onUpdateStatus, onEdit, onDeleteRequest, onCashOutRequest, bookmakerIcon, justSaved }) => {
  const payout = getPayout(bet);

  // Destello al marcar como ganada (o al guardar): una franja que cruza la fila y un rebote del badge.
  // 'won' es verde; 'saved' es un destello neutro para apuestas guardadas que no están ganadas.
  const [flash, setFlash] = useState<{ kind: 'won' | 'saved'; n: number } | null>(null);
  const prevStatus = useRef(bet.status);
  useEffect(() => {
    if (prevStatus.current !== BetStatus.WON && bet.status === BetStatus.WON) setFlash(f => ({ kind: 'won', n: (f?.n ?? 0) + 1 }));
    prevStatus.current = bet.status;
  }, [bet.status]);
  useEffect(() => {
    if (justSaved) setFlash(f => ({ kind: bet.status === BetStatus.WON ? 'won' : 'saved', n: (f?.n ?? 0) + 1 }));
  }, [justSaved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), CELEBRATION_MS);
    return () => clearTimeout(t);
  }, [flash]);
  const badgePop = flash?.kind === 'won' ? 'bt-badge-pop' : '';
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.005 }}
      className="glass-panel relative rounded-xl md:rounded-2xl p-2 md:p-3 lg:p-4 flex flex-col lg:flex-row items-center gap-2 lg:gap-3 group transition-all w-full overflow-hidden"
      style={getRowStyle(bet.status)}
    >
      {flash && <span key={flash.n} aria-hidden="true" className={`bt-sweep bt-sweep--play ${flash.kind === 'saved' ? 'bt-sweep--saved' : ''}`} />}
      {/* Contenedor Principal (Info + Stats en Móvil) */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 w-full overflow-hidden">
        {visibleColumns.sportIcon && (
          <div className="w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-xs md:text-xl text-slate-300 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
              {getSportIcon(bet.sport)}
          </div>
        )}
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 flex-wrap overflow-hidden">
            {visibleColumns.bookmaker && <BookmakerTag name={bet.bookmaker} icon={bookmakerIcon} />}
            {bet.freebet && <span title="Freebet (apuesta gratis)" className="px-1.5 py-0.5 rounded-md bg-violet-500 text-white text-[9px] md:text-[10px] font-black tracking-wider shrink-0">FB</span>}
            {visibleColumns.date && (
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                <Calendar size={9} /> {new Date(bet.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          <h4 className="font-black text-[10px] md:text-sm text-white leading-tight truncate uppercase italic tracking-tight w-full">{bet.description || bet.sport}</h4>
        </div>
        
        {/* Mobile Stats Summary (Solo visible en móvil) */}
        <div className="lg:hidden flex items-center gap-2 shrink-0 ml-1">
           <div className="flex flex-col items-end">
              <span className="text-[11px] font-black text-white leading-none tracking-tighter">{bet.odds.toFixed(2)}</span>
              <span className="text-[8px] font-bold text-zinc-500 leading-none mt-1 uppercase tracking-tighter">{bet.stake}€</span>
           </div>
           <div className="min-w-[50px] text-right border-l border-white/10 pl-2">
             <p className={`text-xs font-black tracking-tighter ${bet.status === BetStatus.PENDING ? 'text-zinc-700' : (bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-[#e2001a]' : 'text-slate-400')}`}>
                {bet.status === BetStatus.PENDING ? '--' : `${bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}€`}
             </p>
             {payout !== null && (
               <p className="text-[8px] font-bold text-zinc-400 leading-none mt-1 uppercase tracking-tighter whitespace-nowrap">Cobrado {payout.toFixed(2)}€</p>
             )}
           </div>
        </div>
      </div>

      {/* Seccion de Stats y Acciones para Escritorio */}
      <div className="hidden lg:flex items-center gap-4 shrink-0 lg:ml-auto">
        <div className="flex gap-4 border-l border-white/5 pl-4 items-center">
          {visibleColumns.odds && (
            <div className="text-center min-w-[50px]">
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Cuota</p>
              <p className="text-sm font-black text-white">{bet.odds.toFixed(2)}</p>
            </div>
          )}
          {visibleColumns.stake && (
            <div className="text-center min-w-[50px]">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Apuesta</p>
              <p className="text-sm font-black text-white">{bet.stake}€</p>
            </div>
          )}
          {visibleColumns.profit && (
            // Total cobrado (solo en apuestas ganadas o con cash out); hueco vacío en el resto para que las columnas queden alineadas
            <div className="text-right min-w-[80px] border-l border-white/5 pl-4">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{payout !== null ? 'Cobrado' : ' '}</p>
                <p className="text-base font-black tracking-tighter text-white">{payout !== null ? `${payout.toFixed(2)}€` : ' '}</p>
            </div>
          )}
          {visibleColumns.profit && (
            <div className="text-right min-w-[80px] border-l border-white/5 pl-4">
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Beneficio</p>
                <p className={`text-base font-black tracking-tighter ${bet.status === BetStatus.PENDING ? 'text-zinc-800' : (bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-[#e2001a]' : 'text-slate-400')}`}>
                  {bet.status === BetStatus.PENDING ? '--' : `${bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}€`}
                </p>
            </div>
          )}
        </div>

        {visibleColumns.actions && (
          <div className="flex items-center gap-2 border-l border-white/5 pl-4">
              {bet.status === BetStatus.PENDING ? (
                <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-xl border border-white/5">
                  <button onClick={() => onUpdateStatus(bet.id, BetStatus.WON)} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shrink-0"><Check size={14} /></button>
                  <button onClick={() => onUpdateStatus(bet.id, BetStatus.LOST)} className="w-8 h-8 rounded-lg bg-[#e2001a]/10 text-[#e2001a] hover:bg-[#e2001a] hover:text-white transition-all flex items-center justify-center shrink-0"><X size={14} /></button>
                  <button onClick={() => onCashOutRequest(bet)} title="Cash out" aria-label="Cash out" className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center shrink-0"><Banknote size={14} /></button>
                </div>
              ) : (
                <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusStyle(bet.status)} ${badgePop}`}>
                  {formatStatusText(bet.status)}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(bet)} className="w-8 h-8 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center shrink-0"><Edit3 size={14} /></button>
                  <button onClick={() => onDeleteRequest(bet.id)} className="w-8 h-8 rounded-lg text-zinc-500 hover:text-[#e2001a] hover:bg-[#e2001a]/10 transition-all flex items-center justify-center shrink-0"><Trash2 size={14} /></button>
              </div>
          </div>
        )}
      </div>

      {/* Contenedor de Acciones Móvil (Solo visible en móvil) */}
      {!visibleColumns.profit && false /* Placeholder for logic simplified below */}
      {visibleColumns.actions && (
        <div className="lg:hidden flex items-center justify-between w-full border-t border-white/5 pt-2 mt-1">
          <div className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${getStatusStyle(bet.status)} ${badgePop}`}>
            {formatStatusText(bet.status)}
          </div>
          <div className="flex items-center gap-1">
            {bet.status === BetStatus.PENDING && (
               <div className="flex gap-1 mr-2 pr-2 border-r border-white/5">
                 <button onClick={() => onUpdateStatus(bet.id, BetStatus.WON)} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Check size={12} /></button>
                 <button onClick={() => onUpdateStatus(bet.id, BetStatus.LOST)} className="w-7 h-7 rounded-lg bg-[#e2001a]/10 text-[#e2001a] flex items-center justify-center"><X size={12} /></button>
                 <button onClick={() => onCashOutRequest(bet)} title="Cash out" aria-label="Cash out" className="w-7 h-7 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center"><Banknote size={12} /></button>
               </div>
            )}
            <button onClick={() => onEdit(bet)} className="w-7 h-7 rounded-lg text-zinc-500 flex items-center justify-center"><Edit3 size={12} /></button>
            <button onClick={() => onDeleteRequest(bet.id)} className="w-7 h-7 rounded-lg text-zinc-500 flex items-center justify-center"><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </motion.div>
  );
});

const BetList: React.FC<BetListProps> = ({ bets, allBets, bookmakers, bankrolls, activeBankrollName, onDelete, onUpdateStatus, onEdit, justSavedId }) => {
  const bookmakerIcons = useMemo(
    () => new Map(bookmakers.map(b => [b.name.toLowerCase(), b.icon])),
    [bookmakers]
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookmakerFilter, setBookmakerFilter] = useState<string>('ALL');
  const [grouping, setGrouping] = useState<'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [betToDelete, setBetToDelete] = useState<string | null>(null);
  const [betToCashOut, setBetToCashOut] = useState<Bet | null>(null);
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    sportIcon: true,
    bookmaker: true,
    date: true,
    odds: true,
    stake: true,
    profit: true,
    actions: true
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const availableBookmakers = useMemo(() => {
    const books = new Set(bets.map(b => b.bookmaker).filter(Boolean));
    return Array.from(books).sort();
  }, [bets]);

  const filteredBets = useMemo(() => {
    return bets.filter(b => {
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      const matchesBookmaker = bookmakerFilter === 'ALL' || b.bookmaker === bookmakerFilter;
      const matchesSearch = b.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            b.bookmaker.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesBookmaker && matchesSearch;
    });
  }, [bets, statusFilter, bookmakerFilter, searchTerm]);

  const quickStats = useMemo(() => {
    const closed = filteredBets.filter(b => b.status !== BetStatus.PENDING);
    const profit = closed.reduce((acc, b) => acc + b.profit, 0);
    const stake = closed.reduce((acc, b) => acc + realStake(b), 0);
    return {
      profit,
      yield: calculateYield(profit, stake),
      count: filteredBets.length
    };
  }, [filteredBets]);

  const groupedBets = useMemo(() => {
    if (grouping === 'NONE') return { 'Todas las apuestas': { bets: filteredBets, profit: quickStats.profit, stake: filteredBets.reduce((acc, b) => acc + (b.status !== BetStatus.PENDING ? realStake(b) : 0), 0) } };

    const groups: Record<string, { bets: Bet[]; profit: number; stake: number }> = {};
    const sortedBets = [...filteredBets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedBets.forEach(bet => {
      const date = new Date(bet.date);
      let key = '';

      if (grouping === 'DAY') {
        key = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else if (grouping === 'WEEK') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `Semana ${weekNum} - ${date.getFullYear()}`;
      } else if (grouping === 'MONTH') {
        key = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        key = key.charAt(0).toUpperCase() + key.slice(1);
      } else if (grouping === 'YEAR') {
        key = `Año ${date.getFullYear()}`;
      }

      if (!groups[key]) groups[key] = { bets: [], profit: 0, stake: 0 };
      groups[key].bets.push(bet);
      if (bet.status !== BetStatus.PENDING) {
        groups[key].profit += bet.profit;
        groups[key].stake += realStake(bet);
      }
    });

    return groups;
  }, [filteredBets, grouping, quickStats.profit]);

  const toggleGroup = useCallback((groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  const handleExportCsv = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const safeName = activeBankrollName.replace(/[^\p{L}\p{N}]+/gu, '_');
    downloadBetsCsv(filteredBets, bankrolls, `BetTrack_${safeName}_${today}.csv`);
    setShowExportMenu(false);
  }, [filteredBets, bankrolls, activeBankrollName]);

  const handleExportAllCsv = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    downloadBetsCsv(allBets, bankrolls, `BetTrack_Todas_${today}.csv`);
    setShowExportMenu(false);
  }, [allBets, bankrolls]);

  const toggleAllGroups = useCallback(() => {
    const allGroups = Object.keys(groupedBets);
    const someExpanded = allGroups.some(g => !collapsedGroups[g]);
    const newState: Record<string, boolean> = {};
    allGroups.forEach(g => {
      newState[g] = someExpanded;
    });
    setCollapsedGroups(newState);
  }, [groupedBets, collapsedGroups]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4 md:px-0 pb-20"
    >
      <header className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6">
          <div className="flex items-start justify-between w-full lg:w-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-[#e2001a] font-black text-[10px] uppercase tracking-[0.5em] flex items-center gap-2">
                <Activity size={12} /> Auditoria de apuestas
              </span>
              <h2 className="text-xl md:text-4xl font-black tracking-tight text-white mt-2">{activeBankrollName}</h2>
            </motion.div>

            {/* Selector de agrupación sutil para móvil */}
            <div className="md:hidden self-center">
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={10} />
                <select 
                  className="bg-zinc-950/50 border border-white/5 rounded-xl pl-6 pr-2 py-1.5 text-[9px] font-black text-slate-500 outline-none appearance-none uppercase tracking-tighter"
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value as 'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR')}
                >
                  <option value="NONE">Sin agrupar</option>
                  <option value="DAY">Día</option>
                  <option value="WEEK">Semana</option>
                  <option value="MONTH">Mes</option>
                  <option value="YEAR">Año</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full lg:w-auto">
              <div className="relative group flex-1 hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#e2001a] transition-colors" size={14} />
                <input 
                    type="text" 
                    placeholder="Buscar..."
                    className="bg-zinc-950 border border-white/5 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-bold text-white outline-none focus:border-[#e2001a]/50 w-full lg:w-64 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none hidden md:block">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={12} />
                  <select 
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl pl-9 pr-4 py-3.5 text-xs font-bold text-slate-400 outline-none focus:border-[#e2001a]/50 shadow-inner appearance-none"
                    value={bookmakerFilter}
                    onChange={(e) => setBookmakerFilter(e.target.value)}
                  >
                    <option value="ALL">Casas</option>
                    {availableBookmakers.map(book => (
                        <option key={book} value={book}>{book}</option>
                    ))}
                  </select>
                </div>

                <div className="relative flex-1 sm:flex-none hidden md:block">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={12} />
                  <select 
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl pl-9 pr-4 py-3.5 text-xs font-bold text-slate-400 outline-none focus:border-[#e2001a]/50 shadow-inner appearance-none"
                    value={grouping}
                    onChange={(e) => setGrouping(e.target.value as 'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR')}
                  >
                    <option value="NONE">Sin agrupar</option>
                    <option value="DAY">Día</option>
                    <option value="WEEK">Semana</option>
                    <option value="MONTH">Mes</option>
                    <option value="YEAR">Año</option>
                  </select>
                </div>

                {grouping !== 'NONE' && (
                  <button 
                    onClick={toggleAllGroups}
                    className="flex-1 sm:flex-none bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-inner flex items-center justify-center hidden md:flex"
                    title={Object.values(collapsedGroups).some(v => !v) ? "Colapsar todo" : "Expandir todo"}
                  >
                    {Object.keys(groupedBets).length > 0 && Object.keys(groupedBets).every(g => collapsedGroups[g]) ? <ChevronDown size={14} className="-rotate-90" /> : <ChevronDown size={14} />}
                  </button>
                )}

                <div className="relative flex-1 sm:flex-none hidden md:block">
                  <button 
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-inner flex items-center justify-center"
                    title="Configurar columnas"
                  >
                    <Columns size={14} />
                  </button>

                  <AnimatePresence>
                    {showColumnSettings && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-white/10 rounded-2xl p-4 shadow-2xl z-50"
                      >
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Columnas Visibles</p>
                        <div className="space-y-2">
                          {Object.entries(visibleColumns).map(([key, value]) => (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={value}
                                onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !value }))}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${value ? 'bg-[#e2001a] border-[#e2001a]' : 'border-white/20'}`}>
                                {value && <Check size={8} className="text-white" />}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors capitalize">
                                {key === 'sportIcon' ? 'Icono Deporte' : 
                                 key === 'bookmaker' ? 'Casa' : 
                                 key === 'date' ? 'Fecha' : 
                                 key === 'odds' ? 'Cuota' : 
                                 key === 'stake' ? 'Apuesta' : 
                                 key === 'profit' ? 'Beneficio' : 'Acciones'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all shadow-inner flex items-center justify-center gap-2"
                    aria-haspopup="menu"
                    aria-expanded={showExportMenu}
                  >
                    <Download size={14} />
                    <span>Exportar</span>
                    <ChevronDown size={12} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showExportMenu && (
                      <>
                        {/* Capa invisible para cerrar el menú al pulsar fuera */}
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-white/10 rounded-2xl p-2 shadow-2xl z-50"
                        >
                          <p className="px-3 pt-2 pb-1 text-[9px] font-black text-slate-600 uppercase tracking-widest">Excel</p>
                          <ExportMenuItem
                            icon={<FileSpreadsheet size={16} />}
                            title="Apuestas filtradas"
                            subtitle={`${filteredBets.length} apuestas de la vista actual`}
                            onClick={handleExportCsv}
                            disabled={filteredBets.length === 0}
                          />
                          <ExportMenuItem
                            icon={<FileSpreadsheet size={16} />}
                            title="Todas las apuestas"
                            subtitle={`${allBets.length} apuestas de todos los bankrolls`}
                            onClick={handleExportAllCsv}
                            disabled={allBets.length === 0}
                          />
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
          </div>
        </div>

        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5 gap-1 overflow-x-auto no-scrollbar">
            {['ALL', 'PENDING', 'WON', 'LOST', 'CASH_OUT'].map(f => (
                <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    statusFilter === f ? 'bg-[#e2001a] text-white shadow-lg shadow-red-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
                >
                {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Activas' : formatStatusText(f as BetStatus)}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-zinc-900/30 border border-white/5 p-2 md:p-5 rounded-xl md:rounded-[2rem] backdrop-blur-sm flex flex-col items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Profit</p>
            <p className={`text-lg md:text-2xl font-black ${quickStats.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
              {quickStats.profit >= 0 ? '+' : ''}{quickStats.profit.toFixed(1)}€
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-zinc-900/30 border border-white/5 p-2 md:p-5 rounded-xl md:rounded-[2rem] backdrop-blur-sm flex flex-col items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Yield</p>
            <p className={`text-lg md:text-2xl font-black ${quickStats.yield >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
              {quickStats.yield.toFixed(1)}%
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-zinc-900/30 border border-white/5 p-2 md:p-5 rounded-xl md:rounded-[2rem] backdrop-blur-sm flex flex-col items-center justify-center text-center"
          >
            <p className="text-[10px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Apuestas</p>
            <p className="text-lg md:text-2xl font-black text-white">{quickStats.count}</p>
          </motion.div>
        </div>
      </header>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {Object.keys(groupedBets).length > 0 ? Object.entries(groupedBets).map(([groupName, groupData]) => (
            <motion.div 
              key={groupName} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {grouping !== 'NONE' && (
                <div 
                  className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl cursor-pointer hover:bg-zinc-900/90 transition-all group/header sticky top-4 z-10 shadow-lg"
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: collapsedGroups[groupName] ? -90 : 0 }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                    >
                      <ChevronDown size={14} className="text-slate-500" />
                    </motion.div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{groupName}</h3>
                  </div>
                  
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-6 hidden sm:flex">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Yield</span>
                        <span className={`text-sm md:text-sm font-black ${groupData.stake > 0 ? (groupData.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]') : 'text-slate-500'}`}>
                          {calculateYield(groupData.profit, groupData.stake).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-px h-6 md:h-8 bg-white/10"></div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Profit</span>
                      <span className={`text-lg md:text-lg font-black tracking-tighter ${groupData.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
                        {groupData.profit >= 0 ? '+' : ''}{groupData.profit.toFixed(2)}€
                      </span>
                    </div>
                    <div className="w-px h-6 md:h-8 bg-white/10"></div>
                    <div className="bg-zinc-950 px-2 py-1 rounded-lg border border-white/5">
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400">{groupData.bets.length} OPS</span>
                    </div>
                  </div>
                </div>
              )}
              
              <AnimatePresence initial={false}>
                {!collapsedGroups[groupName] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: 'auto', 
                      opacity: 1,
                      transition: { 
                        height: { duration: 0.25, ease: "easeOut" },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: { 
                        height: { duration: 0.2, ease: "easeIn" },
                        opacity: { duration: 0.15 }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-3 md:gap-4 pt-2">
                      <AnimatePresence mode="popLayout">
                        {groupData.bets.map(bet => (
                          <BetRow 
                            key={bet.id} 
                            bet={bet} 
                            visibleColumns={visibleColumns} 
                            onUpdateStatus={onUpdateStatus} 
                            onEdit={onEdit} 
                            onDeleteRequest={setBetToDelete}
                            onCashOutRequest={(b: Bet) => { setBetToCashOut(b); setCashOutAmount(''); }}
                            bookmakerIcon={bookmakerIcons.get(bet.bookmaker.toLowerCase())}
                            justSaved={bet.id === justSavedId}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="glass-panel rounded-[3rem] p-24 text-center border-dashed border-2 border-white/5 flex flex-col items-center gap-6"
            >
              <Activity size={60} className="text-zinc-800" />
              <div>
                  <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Sin registros históricos</p>
                  <p className="text-zinc-700 font-bold text-[10px] mt-1 italic">Empieza a registrar tus operaciones para ver el análisis</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {betToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle size={32} className="text-[#e2001a]" />
              </div>
              
              <h3 className="text-2xl font-black text-white text-center italic tracking-tight mb-2">¿Eliminar Apuesta?</h3>
              <p className="text-slate-500 text-sm font-bold text-center leading-relaxed mb-8">
                Esta acción es permanente y no se podrá recuperar. Los datos de tu bankroll se recalcularán automáticamente.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setBetToDelete(null)}
                  className="bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onDelete(betToDelete);
                    setBetToDelete(null);
                  }}
                  className="bg-[#e2001a] text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-red-900/20"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cash out: importe cobrado */}
      <AnimatePresence>
        {betToCashOut && (() => {
          const amount = parseDecimal(cashOutAmount);
          const valid = !Number.isNaN(amount);
          const profit = valid ? calculateProfit(BetStatus.CASH_OUT, betToCashOut.odds, betToCashOut.stake, amount, betToCashOut.freebet) : null;
          const confirm = () => {
            if (!valid) return;
            onUpdateStatus(betToCashOut.id, BetStatus.CASH_OUT, amount);
            setBetToCashOut(null);
          };
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setBetToCashOut(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
              >
                <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Banknote size={32} className="text-yellow-500" />
                </div>
                <h3 className="text-2xl font-black text-white text-center italic tracking-tight mb-1">Cash Out</h3>
                <p className="text-slate-500 text-xs font-bold text-center mb-6 truncate">{betToCashOut.description || betToCashOut.bookmaker}</p>

                <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                  <div className="bg-zinc-900 rounded-2xl py-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{betToCashOut.freebet ? 'Freebet' : 'Apostado'}</p>
                    <p className={`text-lg font-black ${betToCashOut.freebet ? 'text-violet-300' : 'text-white'}`}>{betToCashOut.stake.toFixed(2)}€</p>
                  </div>
                  <div className="bg-zinc-900 rounded-2xl py-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cuota</p>
                    <p className="text-lg font-black text-white">{betToCashOut.odds.toFixed(2)}</p>
                  </div>
                </div>

                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Importe total cobrado (€)</label>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirm(); }}
                  placeholder="Ej: 15,50"
                  className="mt-2 w-full bg-yellow-500/5 border border-yellow-500/30 rounded-2xl px-5 py-4 text-2xl font-black text-yellow-400 text-center outline-none focus:border-yellow-500"
                />
                <p className={`text-center text-sm font-black mt-3 h-5 ${profit === null ? 'text-slate-600' : profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
                  {profit === null ? (cashOutAmount ? 'Introduce un importe válido' : '') : `Resultado: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)}€`}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button onClick={() => setBetToCashOut(null)} className="bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-widest text-[10px]">
                    Cancelar
                  </button>
                  <button onClick={confirm} disabled={!valid} className="bg-yellow-500 text-black font-black py-4 rounded-2xl hover:bg-yellow-400 transition-all uppercase tracking-widest text-[10px] disabled:opacity-30">
                    Confirmar cash out
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
};

const ExportMenuItem: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; disabled?: boolean }> = ({ icon, title, subtitle, onClick, disabled }) => (
  <button
    role="menuitem"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none group"
  >
    <span className="w-8 h-8 shrink-0 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#e2001a]">{icon}</span>
    <span className="min-w-0">
      <span className="block text-xs font-black text-white">{title}</span>
      <span className="block text-[10px] font-bold text-slate-500 truncate">{subtitle}</span>
    </span>
  </button>
);

export default BetList;
