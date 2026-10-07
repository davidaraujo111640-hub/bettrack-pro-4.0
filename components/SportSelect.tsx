import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Sport } from '../types';
import { getSportIconSrc } from '../src/utils/icons';

interface Props {
  sports: Sport[];
  value: Sport;
  onChange: (sport: Sport) => void;
  /** Deportes más usados, que salen arriba */
  recent?: string[];
}

const SportIcon: React.FC<{ sport: string; className: string }> = ({ sport, className }) => (
  <span className={`${className} bg-zinc-800 flex items-center justify-center shrink-0`}>
    <img src={getSportIconSrc(sport)} alt="" className="w-[68%] h-[68%] object-contain" draggable={false} />
  </span>
);

/**
 * Selector de deporte: desplegable con el icono de cada deporte, los más usados arriba
 * y manejo con teclado (flechas, Enter, Escape).
 */
const SportSelect: React.FC<Props> = ({ sports, value, onChange, recent = [] }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { recentItems, restItems } = useMemo(() => {
    const rec = recent.filter((s): s is Sport => (sports as string[]).includes(s));
    return { recentItems: rec, restItems: sports.filter(s => !rec.includes(s)) };
  }, [sports, recent]);

  const items: Sport[] = [...recentItems, ...restItems];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const openList = () => {
    setActive(Math.max(0, items.indexOf(value)));
    setOpen(true);
  };

  const choose = (sport: Sport) => {
    onChange(sport);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) choose(items[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const row = (sport: Sport, index: number) => {
    const isSel = sport === value;
    return (
      <button
        type="button"
        key={sport}
        data-index={index}
        role="option"
        aria-selected={isSel}
        onMouseEnter={() => setActive(index)}
        onClick={() => choose(sport)}
        className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl text-left text-sm font-bold transition-colors ${index === active ? 'bg-white/[0.07]' : ''} ${isSel ? 'text-white bg-[#e2001a]/10' : 'text-slate-200'}`}
      >
        <SportIcon sport={sport} className="w-7 h-7 rounded-lg" />
        <span className="truncate">{sport}</span>
        {isSel && <Check size={14} className="ml-auto text-[#e2001a] shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center gap-3 bg-zinc-900 border rounded-2xl px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors ${open ? 'border-[#e2001a]' : 'border-white/10 hover:border-white/20'}`}
      >
        <SportIcon sport={value} className="w-8 h-8 rounded-lg" />
        <span className="truncate">{value}</span>
        <ChevronDown size={16} className={`ml-auto text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-2">
          <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto no-scrollbar space-y-0.5">
            {recentItems.length > 0 && <p className="px-2 pt-1.5 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Más usados</p>}
            {recentItems.map((s, i) => row(s, i))}
            {recentItems.length > 0 && <p className="px-2 pt-2 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Todos</p>}
            {restItems.map((s, i) => row(s, recentItems.length + i))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SportSelect;
