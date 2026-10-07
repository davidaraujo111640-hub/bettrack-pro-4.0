import React, { useMemo } from 'react';
import { Bet } from '../types';
import { computeBetStats, GroupStats } from '../src/utils/betMath';

interface Props {
  bets: Bet[];
  initialCapital: number;
  bankrollName: string;
}

const eur = (n: number, sign = false) => `${sign && n > 0 ? '+' : ''}${n.toFixed(2)}€`;
const pct = (n: number, sign = false) => `${sign && n > 0 ? '+' : ''}${n.toFixed(1)}%`;
const tone = (n: number) => (n > 0 ? 'text-emerald-400' : n < 0 ? 'text-[#e2001a]' : 'text-white');
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
};

const Stat: React.FC<{ label: string; value: string; className?: string; hint?: string }> = ({ label, value, className, hint }) => (
  <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-3 md:p-4" title={hint}>
    <p className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-base md:text-xl font-black tracking-tight ${className ?? 'text-white'}`}>{value}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</h4>
    {children}
  </div>
);

const GroupTable: React.FC<{ title: string; rows: GroupStats[]; label?: (k: string) => string }> = ({ title, rows, label }) => (
  <div className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden">
    <h5 className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-white/5">{title}</h5>
    {rows.length === 0 ? (
      <p className="px-4 py-6 text-center text-xs font-bold text-slate-600">Sin datos</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] sm:text-xs">
          <thead>
            <tr className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <th className="text-left px-2 sm:px-4 py-2"></th>
              <th className="text-right px-1 sm:px-2 py-2"><span className="sm:hidden">Nº</span><span className="hidden sm:inline">Apuestas</span></th>
              <th className="text-right px-1 sm:px-2 py-2">Acierto</th>
              <th className="hidden sm:table-cell text-right px-2 py-2">Apostado</th>
              <th className="text-right px-1 sm:px-2 py-2">Yield</th>
              <th className="text-right px-2 sm:px-4 py-2">Beneficio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} className="border-t border-white/5 font-bold">
                <td className="px-2 sm:px-4 py-2.5 text-white whitespace-nowrap max-w-[96px] sm:max-w-none truncate">{label ? label(r.key) : r.key}</td>
                <td className="px-1 sm:px-2 py-2.5 text-right text-slate-300">{r.bets}</td>
                <td className="px-1 sm:px-2 py-2.5 text-right text-slate-300">{pct(r.winRate)}</td>
                <td className="hidden sm:table-cell px-2 py-2.5 text-right text-slate-300 whitespace-nowrap">{eur(r.staked)}</td>
                <td className={`px-1 sm:px-2 py-2.5 text-right whitespace-nowrap ${tone(r.yield)}`}>{pct(r.yield, true)}</td>
                <td className={`px-2 sm:px-4 py-2.5 text-right font-black whitespace-nowrap ${tone(r.profit)}`}>{eur(r.profit, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

/** Estadísticas completas de las apuestas del bankroll seleccionado. */
const BankrollStatsPanel: React.FC<Props> = ({ bets, initialCapital, bankrollName }) => {
  const s = useMemo(() => computeBetStats(bets, initialCapital), [bets, initialCapital]);
  const streak = s.currentStreak === 0 ? '—' : s.currentStreak > 0 ? `${s.currentStreak} ganada${s.currentStreak > 1 ? 's' : ''}` : `${-s.currentStreak} perdida${s.currentStreak < -1 ? 's' : ''}`;

  return (
    <div className="glass-panel p-3 sm:p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/5 space-y-8">
      <div>
        <h3 className="text-base md:text-lg font-black text-white uppercase italic">Estadísticas detalladas</h3>
        <p className="text-[10px] font-bold text-slate-500 mt-1">Bankroll: <span className="text-slate-300">{bankrollName}</span> · {s.total} apuestas</p>
      </div>

      <Section title="Resultado">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Beneficio" value={eur(s.profit, true)} className={tone(s.profit)} />
          <Stat label="Yield" value={pct(s.yield, true)} className={tone(s.yield)} hint="Beneficio / total apostado" />
          <Stat label="ROI" value={pct(s.roi, true)} className={tone(s.roi)} hint="Beneficio / capital inicial" />
          <Stat label="Acierto" value={pct(s.winRate)} hint="Ganadas sobre apuestas cerradas (sin anuladas)" />
          <Stat label="Factor beneficio" value={s.profitFactor === null ? '—' : s.profitFactor.toFixed(2)} className={s.profitFactor !== null && s.profitFactor < 1 ? 'text-[#e2001a]' : 'text-emerald-400'} hint="Ganancias brutas / pérdidas brutas. Más de 1 = rentable" />
          <Stat label="Total apostado" value={eur(s.staked)} />
        </div>
      </Section>

      <Section title="Apuestas">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <Stat label="Total" value={String(s.total)} />
          <Stat label="Ganadas" value={String(s.won)} className="text-emerald-400" />
          <Stat label="Perdidas" value={String(s.lost)} className="text-[#e2001a]" />
          <Stat label="Cash out" value={String(s.cashOut)} className="text-yellow-500" />
          <Stat label="Anuladas" value={String(s.voided)} className="text-slate-400" hint="Reembolsadas o anuladas" />
          <Stat label="Activas" value={String(s.pending)} className="text-sky-400" />
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Section title="Importes y cuotas">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Stake medio" value={eur(s.avgStake)} />
            <Stat label="Stake máximo" value={eur(s.maxStake)} />
            <Stat label="En juego" value={eur(s.pendingStake)} className="text-sky-400" hint="Importe de las apuestas activas" />
            <Stat label="Cuota media" value={s.avgOdds.toFixed(2)} />
            <Stat label="Cuota media ganadas" value={s.avgOddsWon ? s.avgOddsWon.toFixed(2) : '—'} />
            <Stat label="Ganancia bruta" value={eur(s.grossWins)} className="text-emerald-400" />
            <Stat label="Mayor ganancia" value={eur(s.biggestWin, true)} className="text-emerald-400" />
            <Stat label="Mayor pérdida" value={eur(s.biggestLoss)} className="text-[#e2001a]" />
            <Stat label="Pérdida bruta" value={eur(-s.grossLosses)} className="text-[#e2001a]" />
            <Stat label="Freebets" value={String(s.freebets)} className="text-violet-300" hint="Apuestas gratis registradas" />
            <Stat label="Beneficio freebets" value={eur(s.freebetProfit, true)} className={tone(s.freebetProfit)} hint="Lo ganado con apuestas gratis (ya incluido en el beneficio)" />
          </div>
        </Section>

        <Section title="Rachas">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Mejor racha" value={`${s.bestWinStreak} ✓`} className="text-emerald-400" hint="Más apuestas ganadas seguidas" />
            <Stat label="Peor racha" value={`${s.worstLoseStreak} ✗`} className="text-[#e2001a]" hint="Más apuestas perdidas seguidas" />
            <Stat label="Racha actual" value={streak} className={tone(s.currentStreak)} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        <GroupTable title="Por casa de apuestas" rows={s.byBookmaker} />
        <GroupTable title="Por deporte" rows={s.bySport} />
        <GroupTable title="Por rango de cuota" rows={s.byOdds} />
        <GroupTable title="Por mes" rows={s.byMonth} label={monthLabel} />
      </div>
    </div>
  );
};

export default BankrollStatsPanel;
