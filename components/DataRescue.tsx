import React, { useMemo } from 'react';
import { LifeBuoy, Download } from 'lucide-react';
import { readLocalData } from '../src/utils/localData';
import { downloadBackup } from '../src/utils/backup';
import type { Bankroll } from '../types';

/**
 * Rescate de datos para copias de la web sin las claves de Supabase, donde no se puede
 * iniciar sesión: descarga las apuestas guardadas en este dispositivo como archivo de
 * copia de seguridad, que luego se importa en la web principal (Bankrolls → Importar).
 */
const DataRescue: React.FC = () => {
  const data = useMemo(() => {
    try { return readLocalData(localStorage); } catch { return { bets: [], bankrolls: [], bookmakers: [] }; }
  }, []);

  const download = () => {
    const bankrolls: Bankroll[] = data.bankrolls.length
      ? data.bankrolls
      : [{ id: 'default', name: 'Bankroll Principal', initialCapital: 1000, color: '#e2001a' }];
    downloadBackup({ bets: data.bets, bankrolls, bookmakers: data.bookmakers });
  };

  return (
    <div className="mt-6 glass-panel rounded-3xl p-5 border border-[#ffcc00]/30">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#ffcc00]/15 text-[#ffcc00] flex items-center justify-center shrink-0">
          <LifeBuoy size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-white uppercase tracking-wide">Recupera tus datos</p>
          {data.bets.length > 0 ? (
            <>
              <p className="text-[11px] font-bold text-slate-400 mt-1">
                Este dispositivo tiene guardadas <span className="text-white">{data.bets.length} apuestas</span>. Descárgalas en un archivo, abre la dirección principal de la app, crea tu cuenta y usa <span className="text-white">Bankrolls → Importar</span>.
              </p>
              <button onClick={download} className="mt-3 inline-flex items-center gap-2 bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all">
                <Download size={14} /> Descargar mis datos
              </button>
            </>
          ) : (
            <p className="text-[11px] font-bold text-slate-400 mt-1">No se han encontrado apuestas guardadas en este dispositivo.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataRescue;
