
import React, { useMemo } from 'react';
import { Bet, BankrollStats, BetStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from 'recharts';

interface StatisticsProps {
  bets: Bet[];
  stats: BankrollStats;
}

const COLORS = ['#10b981', '#e2001a', '#3b82f6', '#ffcc00', '#a855f7'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-950 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center gap-4 mb-2 border-b border-white/5 pb-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{label}</p>
          {data.date && <p className="text-[9px] font-bold text-slate-600 italic">{data.date}</p>}
        </div>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.payload.fill || '#e2001a' }}></div>
            <p className="text-xs font-black text-white uppercase tracking-tight">
              {item.name}: <span className={item.value >= 0 ? 'text-emerald-400' : 'text-[#e2001a]'}>
                {typeof item.value === 'number' ? `${item.value.toFixed(2)}€` : item.value}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Statistics: React.FC<StatisticsProps> = ({ bets, stats }) => {
  const sportDistribution = useMemo(() => {
    const dist = bets.reduce((acc: any[], bet) => {
      const existing = acc.find(a => a.name === bet.sport);
      if (existing) {
        existing.value += 1;
        existing.profit += bet.profit;
      } else {
        acc.push({ name: bet.sport, value: 1, profit: bet.profit });
      }
      return acc;
    }, []);
    return dist.sort((a, b) => b.profit - a.profit);
  }, [bets]);

  const bankrollEvolution = useMemo(() => {
    // Sort bets by date first
    const sortedBets = [...bets]
      .filter(b => b.status !== BetStatus.PENDING)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const evolutionData: { name: string, profit: number, cumulative: number, date: string }[] = [];
    let runningTotal = 0;

    // Add initial point
    evolutionData.push({ name: 'Inicio', profit: 0, cumulative: 0, date: '' });

    sortedBets.forEach((bet, index) => {
      runningTotal += bet.profit;
      const dateObj = new Date(bet.date);
      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      evolutionData.push({ 
        name: `Op. ${index + 1}`, 
        profit: bet.profit, 
        cumulative: runningTotal,
        date: formattedDate
      });
    });

    return evolutionData;
  }, [bets]);

  const off = useMemo(() => {
    const dataMax = Math.max(...bankrollEvolution.map((i) => i.cumulative));
    const dataMin = Math.min(...bankrollEvolution.map((i) => i.cumulative));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  }, [bankrollEvolution]);

  const statusDistribution = [
    { name: 'Ganada', value: bets.filter(b => b.status === BetStatus.WON).length },
    { name: 'Perdida', value: bets.filter(b => b.status === BetStatus.LOST).length },
    { name: 'Otras', value: bets.filter(b => b.status !== BetStatus.WON && b.status !== BetStatus.LOST && b.status !== BetStatus.PENDING).length },
  ].filter(s => s.value > 0);

  return (
    <div className="space-y-8 px-4 md:px-0 pb-20">
      <header>
        <span className="text-[#e2001a] font-bold text-xs uppercase tracking-[0.3em]">ANALYTICS</span>
        <h2 className="text-4xl font-black tracking-tight text-white mt-2">Estadísticas</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col items-center border-white/5">
          <h3 className="text-lg font-black mb-6 w-full text-white uppercase italic">Éxito por Estados</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value" stroke="none">
                  {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5">
          <h3 className="text-lg font-black mb-6 text-white uppercase italic">Profit por Deporte</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sportDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} fontWeight="800" />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} fontWeight="800" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="profit" radius={[10, 10, 0, 0]}>
                  {sportDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#e2001a'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 glass-panel p-8 rounded-[2.5rem] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white uppercase italic">Evolución del Bankroll</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stats.totalProfit >= 0 ? 'bg-emerald-500' : 'bg-[#e2001a]'}`}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Total</span>
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bankrollEvolution}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset={off} stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset={off} stopColor="#e2001a" stopOpacity={0.3}/>
                    <stop offset="1" stopColor="#e2001a" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="strokeProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset={off} stopColor="#10b981" stopOpacity={1}/>
                    <stop offset={off} stopColor="#e2001a" stopOpacity={1}/>
                    <stop offset="1" stopColor="#e2001a" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="8 8" stroke="#ffffff03" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  fontWeight="800"
                  dy={10}
                  interval={Math.floor(bankrollEvolution.length / 10)}
                />
                <YAxis 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontWeight="800"
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  name="Balance Acumulado"
                  stroke="url(#strokeProfit)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  baseValue={0}
                  animationDuration={2000}
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (bankrollEvolution.length >= 50 || (payload.cumulative === 0 && index === 0)) return <span key={index} />;
                    return (
                      <circle 
                        key={index}
                        cx={cx} 
                        cy={cy} 
                        r={4} 
                        fill={payload.cumulative >= 0 ? '#10b981' : '#e2001a'} 
                        stroke="#050505"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#fff', stroke: '#1a1a1a', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
