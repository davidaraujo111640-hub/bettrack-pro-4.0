
import React, { useState, useMemo } from 'react';
import { Bet, BetStatus } from '../types';
import { getSportIcon } from '../src/utils/icons';
import { getBookmakerBrand } from '../src/utils/bookmakers';
import { renderBookmakerName } from '../src/utils/bookmakerStyles';

interface BetListProps {
  bets: Bet[];
  activeBankrollName: string;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: BetStatus, profit?: number) => void;
  onEdit: (bet: Bet) => void;
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

const BetList: React.FC<BetListProps> = ({ bets, activeBankrollName, onDelete, onUpdateStatus, onEdit }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookmakerFilter, setBookmakerFilter] = useState<string>('ALL');
  const [grouping, setGrouping] = useState<'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'>('MONTH');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [betToDelete, setBetToDelete] = useState<string | null>(null);
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

  // Extraer casas únicas de las apuestas actuales para el filtro
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
    const stake = closed.reduce((acc, b) => acc + b.stake, 0);
    return {
      profit,
      yield: stake > 0 ? (profit / stake) * 100 : 0,
      count: filteredBets.length
    };
  }, [filteredBets]);

  const groupedBets = useMemo(() => {
    if (grouping === 'NONE') return { 'Todas las apuestas': { bets: filteredBets, profit: quickStats.profit, stake: filteredBets.reduce((acc, b) => acc + (b.status !== BetStatus.PENDING ? b.stake : 0), 0) } };

    const groups: Record<string, { bets: Bet[]; profit: number; stake: number }> = {};
    
    // Sort bets by date descending before grouping
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
        groups[key].stake += bet.stake;
      }
    });

    return groups;
  }, [filteredBets, grouping, quickStats.profit]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleAllGroups = () => {
    const allGroups = Object.keys(groupedBets);
    const someExpanded = allGroups.some(g => !collapsedGroups[g]);
    
    const newState: Record<string, boolean> = {};
    allGroups.forEach(g => {
      newState[g] = someExpanded; // If some are expanded, collapse all.
    });
    setCollapsedGroups(newState);
  };

  const getRowHighlightClass = (status: BetStatus) => {
    switch (status) {
      case BetStatus.WON: 
        return 'bg-emerald-500/[0.07] border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.03)]';
      case BetStatus.LOST: 
        return 'bg-red-500/[0.07] border-red-500/20 shadow-[0_0_20px_rgba(226,0,26,0.03)]';
      case BetStatus.CASH_OUT: 
        return 'bg-yellow-500/[0.07] border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.03)]';
      case BetStatus.REFUNDED: 
        return 'bg-blue-500/[0.07] border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.03)]';
      case BetStatus.PENDING: 
        return 'bg-white/[0.03] border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.01)]';
      default: 
        return 'bg-zinc-900/20 border-white/5';
    }
  };

  return (
    <div className="space-y-6 px-4 md:px-0 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="text-[#e2001a] font-black text-[10px] uppercase tracking-[0.5em]">AUDITORÍA DE CUENTAS</span>
            <h2 className="text-4xl font-black tracking-tight text-white mt-2">{activeBankrollName}</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
              {/* Buscador */}
              <div className="relative group">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#e2001a] transition-colors"></i>
                <input 
                    type="text" 
                    placeholder="Buscar descripción o casa..."
                    className="bg-zinc-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-[#e2001a]/50 w-full sm:w-64 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro Casa de Apuestas */}
              <select 
                className="bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 outline-none focus:border-[#e2001a]/50"
                value={bookmakerFilter}
                onChange={(e) => setBookmakerFilter(e.target.value)}
              >
                <option value="ALL">Todas las Casas</option>
                {availableBookmakers.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
              </select>

              {/* Agrupación */}
              <div className="flex gap-2">
                <select 
                  className="bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 outline-none focus:border-[#e2001a]/50"
                  value={grouping}
                  onChange={(e) => setGrouping(e.target.value as 'NONE' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR')}
                >
                  <option value="NONE">Sin agrupar</option>
                  <option value="DAY">Por Día</option>
                  <option value="WEEK">Por Semana</option>
                  <option value="MONTH">Por Mes</option>
                  <option value="YEAR">Por Año</option>
                </select>
                
                {grouping !== 'NONE' && (
                  <button 
                    onClick={toggleAllGroups}
                    className="bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    title={Object.values(collapsedGroups).some(v => !v) ? "Colapsar todo" : "Expandir todo"}
                  >
                    <i className={`fas ${Object.keys(groupedBets).length > 0 && Object.keys(groupedBets).every(g => collapsedGroups[g]) ? 'fa-expand-arrows-alt' : 'fa-compress-arrows-alt'}`}></i>
                  </button>
                )}

                <div className="relative">
                  <button 
                    onClick={() => setShowColumnSettings(!showColumnSettings)}
                    className="bg-zinc-950 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 hover:text-white hover:border-white/20 transition-all"
                    title="Configurar columnas"
                  >
                    <i className="fas fa-columns"></i>
                  </button>

                  {showColumnSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
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
                              {value && <i className="fas fa-check text-[8px] text-white"></i>}
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
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>

        {/* Filtros de Estado */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5 gap-1 overflow-x-auto no-scrollbar">
            {['ALL', 'PENDING', 'WON', 'LOST', 'CASH_OUT'].map(f => (
                <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                    statusFilter === f ? 'bg-[#e2001a] text-white shadow-lg shadow-red-900/20' : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
                >
                {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Vivas' : formatStatusText(f as BetStatus)}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-[2rem] backdrop-blur-sm">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Profit Segmento</p>
            <p className={`text-2xl font-black ${quickStats.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
              {quickStats.profit >= 0 ? '+' : ''}{quickStats.profit.toFixed(1)}€
            </p>
          </div>
          <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-[2rem] backdrop-blur-sm text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Eficiencia (Yield)</p>
            <p className={`text-2xl font-black ${quickStats.yield >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
              {quickStats.yield.toFixed(1)}%
            </p>
          </div>
          <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-[2rem] backdrop-blur-sm text-right">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Muestra</p>
            <p className="text-2xl font-black text-white">{quickStats.count}</p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {Object.keys(groupedBets).length > 0 ? Object.entries(groupedBets).map(([groupName, groupData]) => (
          <div key={groupName} className="space-y-4">
            {grouping !== 'NONE' && (
              <div 
                className="flex items-center justify-between gap-4 px-4 py-3 bg-zinc-900/80 backdrop-blur-md border border-white/5 rounded-2xl cursor-pointer hover:bg-zinc-900/90 transition-all group/header sticky top-4 z-10 shadow-lg"
                onClick={() => toggleGroup(groupName)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform duration-300 ${collapsedGroups[groupName] ? '-rotate-90' : ''}`}>
                    <i className="fas fa-chevron-down text-[10px] text-slate-500"></i>
                  </div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{groupName}</h3>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-6 hidden sm:flex">
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Yield</span>
                      <span className={`text-sm font-black ${groupData.stake > 0 ? (groupData.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]') : 'text-slate-500'}`}>
                        {groupData.stake > 0 ? (groupData.profit / groupData.stake * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Profit Periodo</span>
                    <span className={`text-lg font-black tracking-tighter ${groupData.profit >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}`}>
                      {groupData.profit >= 0 ? '+' : ''}{groupData.profit.toFixed(2)}€
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="bg-zinc-950 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-[9px] font-black text-slate-400">{groupData.bets.length} OPS</span>
                  </div>
                </div>
              </div>
            )}
            
            {!collapsedGroups[groupName] && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                {groupData.bets.map(bet => (
                  <div 
                    key={bet.id} 
                    className={`glass-panel rounded-2xl p-3 flex flex-col lg:flex-row items-center gap-3 group hover:border-white/30 transition-all ${getRowHighlightClass(bet.status)}`}
                  >
                    <div className="flex items-center gap-3 flex-1 w-full">
                      {visibleColumns.sportIcon && (
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/5 flex items-center justify-center text-xl text-slate-300 shadow-inner shrink-0">
                            {getSportIcon(bet.sport)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          {visibleColumns.bookmaker && (() => {
                            const brand = getBookmakerBrand(bet.bookmaker);
                            return (
                              <div 
                                className="relative flex items-center justify-center px-2 py-0.5 rounded-md shadow-sm border border-white/5 transition-all hover:scale-105 min-w-[80px] h-8 overflow-hidden"
                                style={{ backgroundColor: brand.color }}
                              >
                                <span 
                                  className="text-[11px] font-black uppercase tracking-tighter whitespace-nowrap"
                                  style={{ color: brand.textColor }}
                                >
                                  {renderBookmakerName(bet.bookmaker)}
                                </span>
                                <img 
                                  src={brand.logo} 
                                  alt={bet.bookmaker} 
                                  className="absolute inset-0 w-full h-full object-contain p-0.5 bg-inherit rounded-md opacity-0 transition-opacity duration-300"
                                  style={{ filter: brand.logoFilter }}
                                  referrerPolicy="no-referrer"
                                  onLoad={(e) => {
                                    (e.target as HTMLImageElement).classList.remove('opacity-0');
                                    (e.target as HTMLImageElement).classList.add('opacity-100');
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            );
                          })()}
                          {visibleColumns.date && (
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(bet.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                          )}
                        </div>
                        <h4 className="font-black text-sm text-white leading-tight truncate uppercase italic tracking-tight">{bet.description || bet.sport}</h4>
                      </div>
                    </div>

                    <div className="flex gap-4 border-x border-white/5 px-4 hidden lg:flex items-center">
                      {visibleColumns.odds && (
                        <div className="text-center bg-zinc-950/40 border border-white/10 px-3 py-1.5 rounded-xl relative overflow-hidden group/odds shadow-inner min-w-[60px]">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                          <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5 relative z-10">Cuota</p>
                          <p className="text-base font-black text-white tracking-tighter relative z-10">{bet.odds.toFixed(2)}</p>
                        </div>
                      )}
                      {visibleColumns.stake && (
                        <div className="text-center min-w-[60px]">
                          <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Apuesta</p>
                          <p className="text-sm font-black text-white">{bet.stake}€</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                      {visibleColumns.profit && (
                        <div className="text-right min-w-[100px]">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Beneficio</p>
                            <p className={`text-xl font-black tracking-tighter ${bet.status === BetStatus.PENDING ? 'text-zinc-800' : (bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-[#e2001a]' : 'text-slate-400')}`}>
                              {bet.status === BetStatus.PENDING ? '--' : `${bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}€`}
                            </p>
                        </div>
                      )}

                      {visibleColumns.actions && (
                        <div className="flex items-center gap-1.5">
                          {bet.status === BetStatus.PENDING ? (
                            <>
                              <button onClick={() => onUpdateStatus(bet.id, BetStatus.WON)} className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><i className="fas fa-check text-xs"></i></button>
                              <button onClick={() => onUpdateStatus(bet.id, BetStatus.LOST)} className="w-8 h-8 rounded-lg bg-[#e2001a]/10 text-[#e2001a] border border-[#e2001a]/20 hover:bg-[#e2001a] hover:text-white transition-all"><i className="fas fa-times text-xs"></i></button>
                            </>
                          ) : (
                              <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] shadow-sm ${getStatusStyle(bet.status)}`}>{formatStatusText(bet.status)}</div>
                          )}
                          <div className="flex flex-row gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onEdit(bet)} className="w-7 h-7 rounded-lg hover:bg-white/5 text-zinc-700 hover:text-blue-400 transition-all"><i className="fas fa-pencil text-[9px]"></i></button>
                              <button onClick={() => setBetToDelete(bet.id)} className="w-7 h-7 rounded-lg hover:bg-white/5 text-zinc-700 hover:text-[#e2001a] transition-all"><i className="fas fa-trash text-[9px]"></i></button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )) : (
          <div className="glass-panel rounded-[3rem] p-24 text-center border-dashed border-2 border-white/5 flex flex-col items-center gap-6 opacity-40">
            <i className="fas fa-clipboard-question text-6xl text-zinc-800"></i>
            <div>
                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Sin registros históricos</p>
                <p className="text-zinc-700 font-bold text-[10px] mt-1 italic">Empieza a registrar tus operaciones para ver el análisis</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {betToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <i className="fas fa-triangle-exclamation text-2xl text-[#e2001a]"></i>
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
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusStyle = (status: BetStatus) => {
  switch (status) {
    case BetStatus.WON: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case BetStatus.LOST: return 'bg-[#e2001a]/10 text-[#e2001a] border border-[#e2001a]/20';
    case BetStatus.CASH_OUT: return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
    case BetStatus.REFUNDED: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case BetStatus.CANCELLED: return 'bg-zinc-800 text-zinc-500 border border-white/5';
    default: return 'bg-zinc-800 text-slate-400';
  }
};

export default BetList;
