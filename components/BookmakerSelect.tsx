import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, PenLine, Check } from 'lucide-react';
import { Bookmaker } from '../types';
import { BookmakerLogo, normalizeBookmakerName } from '../src/utils/bookmakerIcons';

interface Props {
  bookmakers: Bookmaker[];
  /** Nombre de la casa elegida ('' si es una casa escrita a mano) */
  value: string;
  onChange: (name: string) => void;
  /** Casas más usadas (por nombre), que salen arriba cuando no se está buscando */
  recent?: string[];
}

const MANUAL = '__manual__';

/**
 * Selector de casa de apuestas: desplegable con icono de cada casa, buscador
 * (filtra por cualquier parte del nombre, sin importar tildes) y manejo con teclado.
 * Incluye la opción "Otros (manual)" para escribir una casa que no está en la lista.
 */
const BookmakerSelect: React.FC<Props> = ({ bookmakers, value, onChange, recent = [] }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = bookmakers.find(b => b.name === value) ?? null;
  const isManual = !selected;

  const { recentItems, restItems } = useMemo(() => {
    const q = normalizeBookmakerName(query);
    const matches = bookmakers.filter(b => normalizeBookmakerName(b.name).includes(q));
    if (q) return { recentItems: [] as Bookmaker[], restItems: matches };
    const rec = recent.map(n => bookmakers.find(b => b.name === n)).filter((b): b is Bookmaker => !!b);
    return { recentItems: rec, restItems: matches.filter(b => !rec.includes(b)) };
  }, [bookmakers, query, recent]);

  // Lista plana para el teclado: más usadas + todas + "Otros (manual)"
  const items: (Bookmaker | typeof MANUAL)[] = [...recentItems, ...restItems, MANUAL];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const openList = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  };

  const choose = (item: Bookmaker | typeof MANUAL) => {
    onChange(item === MANUAL ? '' : item.name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) choose(items[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  const row = (item: Bookmaker | typeof MANUAL, index: number) => {
    const manual = item === MANUAL;
    const isSel = manual ? isManual : item.name === value;
    return (
      <button
        type="button"
        key={manual ? MANUAL : item.id}
        data-index={index}
        role="option"
        aria-selected={isSel}
        onMouseEnter={() => setActive(index)}
        onClick={() => choose(item)}
        className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl text-left text-sm font-bold transition-colors ${index === active ? 'bg-white/[0.07]' : ''} ${isSel ? 'text-white bg-[#e2001a]/10' : 'text-slate-200'}`}
      >
        {manual ? (
          <span className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-slate-400 shrink-0"><PenLine size={14} /></span>
        ) : (
          <BookmakerLogo name={item.name} icon={item.icon} className="w-7 h-7 rounded-lg overflow-hidden shrink-0" />
        )}
        <span className="truncate">{manual ? 'Otros (escribir a mano)' : item.name}</span>
        {isSel && <Check size={14} className="ml-auto text-[#e2001a] shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center gap-3 bg-zinc-900 border rounded-2xl px-3 py-2.5 text-sm font-bold text-white outline-none transition-colors ${open ? 'border-[#e2001a]' : 'border-white/10 hover:border-white/20'}`}
      >
        {selected ? (
          <BookmakerLogo name={selected.name} icon={selected.icon} className="w-8 h-8 rounded-lg overflow-hidden shrink-0" />
        ) : (
          <span className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-slate-400 shrink-0"><PenLine size={15} /></span>
        )}
        <span className="truncate">{selected ? selected.name : 'Otros (escribir a mano)'}</span>
        <ChevronDown size={16} className={`ml-auto text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-2">
          <div className="relative mb-1.5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder="Buscar casa…"
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#e2001a]"
            />
          </div>
          <div ref={listRef} role="listbox" className="max-h-72 overflow-y-auto no-scrollbar space-y-0.5">
            {recentItems.length > 0 && <p className="px-2 pt-1.5 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Más usadas</p>}
            {recentItems.map((b, i) => row(b, i))}
            {recentItems.length > 0 && <p className="px-2 pt-2 pb-1 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Todas</p>}
            {restItems.map((b, i) => row(b, recentItems.length + i))}
            {query && restItems.length === 0 && <p className="px-2 py-3 text-center text-xs font-bold text-slate-600">Ninguna casa coincide con «{query}»</p>}
            <div className="border-t border-white/5 mt-1 pt-1">{row(MANUAL, items.length - 1)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmakerSelect;
