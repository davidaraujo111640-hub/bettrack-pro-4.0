
import React, { useMemo, useState } from 'react';
import { BankrollStats, Bet, BetStatus } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { getSportIcon } from '../src/utils/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ShieldCheck, Trophy, Target, Activity, Zap, Clock } from 'lucide-react';

interface DashboardProps {
  stats: BankrollStats;
  bets: Bet[];
  userName?: string;
  onProfileClick?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { date: string; cumulative: number }; color?: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-zinc-950 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 border-b border-white/5 pb-1">{label}</p>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${val >= 0 ? 'bg-emerald-400' : 'bg-[#e2001a]'}`}></div>
          <p className="text-sm font-black text-white tracking-tighter">
            PROFIT: <span className={val >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}>
              {val >= 0 ? '+' : ''}{val.toFixed(2)}€
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ stats, bets, userName, onProfileClick }) => {
  const [chartPeriod, setChartPeriod] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('ALL');

  const periods: { id: 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'; label: string }[] = [
    { id: 'WEEK', label: '7D' },
    { id: 'MONTH', label: '30D' },
    { id: 'YEAR', label: '1A' },
    { id: 'ALL', label: 'Todo' }
  ];

  // Explicitly type chartData to ensure cumulativeProfit is treated as a number
  const chartData = useMemo(() => {
    const now = new Date();
    let filteredBets = bets.filter(b => b.status !== BetStatus.PENDING);

    if (chartPeriod === 'WEEK') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredBets = filteredBets.filter(b => new Date(b.date) >= weekAgo);
    } else if (chartPeriod === 'MONTH') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredBets = filteredBets.filter(b => new Date(b.date) >= monthAgo);
    } else if (chartPeriod === 'YEAR') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredBets = filteredBets.filter(b => new Date(b.date) >= yearAgo);
    }

    const sortedBets = [...filteredBets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const data: { date: string; cumulativeProfit: number }[] = [{ date: 'Inicio', cumulativeProfit: 0 }];
    let currentSum = 0;
    sortedBets.forEach(bet => {
      currentSum += bet.profit;
      data.push({
        date: new Date(bet.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        cumulativeProfit: Number(currentSum.toFixed(2))
      });
    });
    return data;
  }, [bets, chartPeriod]);

  const lastFiveBets = useMemo(() => {
    return bets
      .filter(b => b.status !== BetStatus.PENDING)
      .slice(0, 5);
  }, [bets]);

  // Fix: Added explicit return type and properly typed accumulator to fix the 'unknown' error on toFixed
  const topPerformance = useMemo<{ name: string; profit: number } | null>(() => {
    const sports: Record<string, number> = {};
    
    bets.forEach(b => {
      if (b.status !== BetStatus.PENDING) {
        sports[b.sport] = (sports[b.sport] || 0) + b.profit;
      }
    });
    
    const entries = Object.entries(sports);
    if (entries.length === 0) return null;
    
    const bestSport = entries.sort((a, b) => b[1] - a[1])[0];
    return { name: bestSport[0], profit: bestSport[1] };
  }, [bets]);

  const averageStake = useMemo(() => {
    if (bets.length === 0) return 0;
    return bets.reduce((acc, b) => acc + b.stake, 0) / bets.length;
  }, [bets]);

  const averageStakePercent = useMemo(() => {
    if (stats.currentBankroll === 0) return 0;
    return (averageStake / stats.currentBankroll) * 100;
  }, [averageStake, stats.currentBankroll]);

  const pendingBets = useMemo(() => {
    return bets.filter(b => b.status === BetStatus.PENDING).slice(0, 3);
  }, [bets]);

  const off = useMemo(() => {
    const dataMax = Math.max(...chartData.map((i) => i.cumulativeProfit), 0);
    const dataMin = Math.min(...chartData.map((i) => i.cumulativeProfit), 0);
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  }, [chartData]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6 pb-12"
    >
      {/* Header con Estado de Forma */}
      <header className="px-4 md:px-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full sm:w-auto"
        >
            <div className="flex items-center justify-between sm:justify-start w-full gap-4">
              <span className="text-[#e2001a] font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-2">
                <Activity size={12} /> CENTRAL DE OPERACIONES
              </span>
              
              {/* Profile Icon Mobile (Only visible in Dashboard/Home per user request) */}
              <button 
                onClick={onProfileClick}
                className="md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-90"
              >
                <ShieldCheck size={20} />
              </button>
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white mt-1">Hola, <span className="text-[#ffcc00]">{userName || 'Usuario'}</span></h2>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto"
        >
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Zap size={10} className="text-yellow-500" /> Estado de Forma (Últ. 5)
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {lastFiveBets.length > 0 ? lastFiveBets.map((bet, i) => {
                    let colorClass = 'bg-zinc-800 border-zinc-700 text-zinc-500';
                    let icon = <Clock size={12} />;

                    if (bet.status === BetStatus.WON) {
                        colorClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                        icon = <Trophy size={14} />;
                    } else if (bet.status === BetStatus.LOST) {
                        colorClass = 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
                        icon = <Target size={14} />;
                    } else if (bet.status === BetStatus.REFUNDED) {
                        colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
                        icon = <Activity size={14} />;
                    } else if (bet.status === BetStatus.CASH_OUT) {
                        colorClass = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
                        icon = <Zap size={14} />;
                    }

                    return (
                        <motion.div 
                          key={i} 
                          whileHover={{ scale: 1.1 }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${colorClass}`}
                        >
                            {icon}
                        </motion.div>
                    );
                }) : <span className="text-zinc-700 text-[10px] font-bold italic">Sin datos recientes</span>}
            </div>
        </motion.div>
      </header>

      {/* Grid Principal: KPIs Maestros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-4 md:px-0">
        
        {/* Card Principal: Profit & ROI */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden border-white/5 group"
        >
           <div className={`absolute -right-10 -top-10 w-64 h-64 blur-[80px] rounded-full opacity-20 transition-all duration-700 group-hover:opacity-30 ${stats.totalProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
           
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div>
                <span className="text-slate-500 font-black uppercase tracking-widest text-[9px] flex items-center gap-2">
                  <Activity size={10} /> Rendimiento Total
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                    <h3 className={`text-5xl md:text-7xl font-black tracking-tighter ${stats.totalProfit >= 0 ? 'text-white' : 'text-[#e2001a]'}`}>
                        {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(1)}<span className="text-xl md:text-2xl ml-1">€</span>
                    </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 md:flex md:gap-6 mt-8">
                    <div className="flex flex-col">
                        <span className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Yield</span>
                        <span className={`text-lg md:text-xl font-black ${stats.yield >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.yield.toFixed(1)}%</span>
                    </div>
                    <div className="hidden md:block w-px h-12 bg-white/10"></div>
                    <div className="flex flex-col">
                        <span className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Win Rate</span>
                        <span className="text-lg md:text-xl font-black text-white">{stats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="hidden md:block w-px h-12 bg-white/10"></div>
                    <div className="flex flex-col">
                        <span className="text-zinc-600 text-[8px] md:text-[9px] font-black uppercase tracking-tighter">Stake Medio</span>
                        <span className="text-lg md:text-xl font-black text-white">{averageStake.toFixed(1)}€</span>
                    </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl md:rounded-3xl p-5 md:p-7 border border-white/5 flex flex-col justify-between hover:bg-white/[0.07] transition-all">
                 <div className="flex justify-between items-start">
                    <div>
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Especialidad</span>
                        <h4 className="text-white font-black text-xl md:text-2xl mt-1">{topPerformance ? topPerformance.name : 'Pendiente'}</h4>
                    </div>
                    <div className="bg-zinc-950 text-white w-14 h-14 md:w-18 md:h-18 rounded-2xl flex items-center justify-center text-3xl md:text-4xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform">
                        {getSportIcon(topPerformance?.name || 'Otros')}
                    </div>
             </div>
             <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] md:text-[11px] font-bold text-slate-400">Has generado <span className="text-emerald-400 font-black">+{topPerformance?.profit?.toFixed(1) ?? '0.0'}€</span> en este deporte.</p>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Card Bankroll: Progreso */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-4 glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/5 flex flex-col justify-between group"
        >
           <div>
                <span className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Banca Disponible</span>
                <p className="text-4xl md:text-5xl font-black text-white mt-1 tracking-tighter">{stats.currentBankroll.toFixed(1)}€</p>
           </div>
           
           <div className="relative py-8 flex flex-col items-center">
                {/* Visual simple de progreso */}
                <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden mt-4 border border-white/5 p-1">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stats.currentBankroll / (stats.initialBankroll * 2)) * 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-[#e2001a] to-[#ffcc00] rounded-full shadow-[0_0_20px_rgba(226,0,26,0.4)]"
                    ></motion.div>
                </div>
                <div className="flex justify-between w-full mt-3">
                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter">Inicio: {stats.initialBankroll}€</span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Objetivo 2x: {stats.initialBankroll * 2}€</span>
                </div>
           </div>

           <div className="bg-zinc-950 p-5 rounded-2xl flex items-center gap-5 border border-white/5 group-hover:border-white/10 transition-all">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${stats.totalProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {stats.totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
                <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Crecimiento</p>
                    <p className={`text-xl font-black ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {((stats.totalProfit / stats.initialBankroll) * 100).toFixed(1)}%
                    </p>
                </div>
           </div>
        </motion.div>
      </div>

      {/* Sección Inferior: Gráfico y Pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 px-4 md:px-0">
        {/* Curva de Rendimiento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-8 glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/5"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                  <Activity size={14} className="text-[#e2001a]" /> Curva de Profit
                </h3>
                
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5 self-start sm:self-center">
                  {periods.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setChartPeriod(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all ${
                        chartPeriod === p.id 
                          ? 'bg-[#e2001a] text-white shadow-lg shadow-red-900/20' 
                          : 'text-zinc-500 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
            </div>
            <div className="h-[220px] md:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset={off} stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset={off} stopColor="#e2001a" stopOpacity={0.5} />
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="10 10" stroke="#ffffff03" vertical={false} />
                    <XAxis dataKey="date" stroke="#525252" fontSize={9} tickLine={false} axisLine={false} fontWeight="900" />
                    <YAxis stroke="#525252" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}€`} fontWeight="900" />
                    <Tooltip 
                        cursor={{ stroke: '#ffffff10', strokeWidth: 2 }}
                        content={<CustomTooltip />}
                    />
                    <ReferenceLine y={0} stroke="#ffffff10" />
                    <Area 
                        type="monotone" 
                        dataKey="cumulativeProfit" 
                        strokeWidth={4} 
                        stroke="#10b981" 
                        fill="url(#splitColor)" 
                        animationDuration={2500} 
                        activeDot={{ r: 7, fill: '#10b981', stroke: '#000', strokeWidth: 4 }}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

        {/* Sidebar de Apuestas Pendientes */}
        <div className="lg:col-span-4 flex flex-col gap-5">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-panel rounded-[2.5rem] p-6 border-white/5 flex-1"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                      <Zap size={12} className="text-yellow-500" /> En Juego
                    </h3>
                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-xl text-[9px] font-black uppercase border border-blue-500/20">{stats.activeBets} Activas</span>
                </div>
                
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {pendingBets.length > 0 ? pendingBets.map((bet, idx) => (
                          <motion.div 
                            key={bet.id} 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + (idx * 0.1) }}
                            className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all cursor-pointer"
                          >
                              <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-[#e2001a] text-xl group-hover:scale-110 transition-transform">
                                  {getSportIcon(bet.sport)}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                  <p className="text-white font-black text-xs truncate uppercase tracking-tight italic">{bet.description}</p>
                                  <p className="text-[9px] font-black text-zinc-600 uppercase mt-0.5 tracking-tighter">
                                    <span className="text-white/40">{bet.odds.toFixed(2)}</span> • <span className="text-white/40">{bet.stake}€</span> • <span className="text-[#e2001a]">{bet.bookmaker}</span>
                                  </p>
                              </div>
                          </motion.div>
                      )) : (
                          <div className="text-center py-12 opacity-20">
                              <Activity size={40} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Sin apuestas pendientes</p>
                          </div>
                      )}
                    </AnimatePresence>
                </div>
                
                {stats.activeBets > 3 && (
                    <button className="w-full mt-6 text-[9px] font-black text-[#e2001a] uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2">
                      Ver todas las activas <Zap size={10} />
                    </button>
                )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-gradient-to-br from-[#e2001a] to-[#920011] rounded-[2.5rem] p-7 text-white shadow-2xl shadow-red-900/30 relative overflow-hidden group"
            >
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                      <ShieldCheck size={16} />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tipster Security</span>
                  </div>
                  <h4 className="font-black text-xl italic tracking-tight">Gestión de Riesgo</h4>
                  <p className="text-xs font-bold text-white/80 mt-2 leading-relaxed">
                      Tu stake medio es del <span className="text-white font-black">{averageStakePercent.toFixed(1)}%</span> de tu banca actual. ¡Mantén la disciplina de hierro!
                  </p>
                </div>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
