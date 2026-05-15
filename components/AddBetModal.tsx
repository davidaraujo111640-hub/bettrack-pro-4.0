
import React, { useState, useRef } from 'react';
import { Bet, BetStatus, Sport, Bankroll, Bookmaker } from '../types';
import { Camera, Loader2, X, Banknote } from 'lucide-react';

interface AddBetModalProps {
  bankrolls: Bankroll[];
  bookmakers: Bookmaker[];
  activeBankrollId: string;
  onClose: () => void;
  onSubmit: (bet: Omit<Bet, 'id' | 'profit'> & { manualProfit?: number }) => void;
  initialData?: Bet;
}

const SPORTS: Sport[] = [
  'Fútbol', 
  'Baloncesto', 
  'Tenis', 
  'eSports', 
  'Béisbol', 
  'NFL', 
  'MMA', 
  'Ciclismo', 
  'F1', 
  'MotoGP', 
  'Boxeo', 
  'Caballos', 
  'Otros'
];

const AddBetModal: React.FC<AddBetModalProps> = ({ bankrolls, bookmakers, activeBankrollId, onClose, onSubmit, initialData }) => {
  const enabledBookmakers = bookmakers.filter(b => b.enabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const [inputOdds, setInputOdds] = useState(initialData ? initialData.odds.toString() : '1.80');
  const [inputStake, setInputStake] = useState(initialData ? initialData.stake.toString() : '10');
  const [inputManualProfit, setInputManualProfit] = useState(initialData ? (initialData.status === BetStatus.CASH_OUT ? (initialData.profit + initialData.stake) : initialData.profit || 0).toString() : '0');

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        date: initialData.date,
        bankrollId: initialData.bankrollId,
        bookmaker: initialData.bookmaker,
        sport: initialData.sport,
        status: initialData.status,
        description: initialData.description,
      };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      bankrollId: activeBankrollId === 'all' ? (bankrolls.find(b => !b.archived)?.id || 'default') : activeBankrollId,
      bookmaker: enabledBookmakers.length > 0 ? enabledBookmakers[0].name : 'Otros',
      sport: 'Fútbol' as Sport,
      status: BetStatus.PENDING,
      description: '',
    };
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/extract-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64, mimeType: file.type }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract data');
      }
      
      const data = await response.json();
      
      // Map extracted data to form
      const updatedData = { ...formData };
      if (data.match || data.selection) {
        updatedData.description = `${data.match || ''} - ${data.selection || ''}`.trim();
        if (updatedData.description.startsWith(' - ')) updatedData.description = updatedData.description.substring(3);
      }
      if (data.odds) setInputOdds(data.odds.toString());
      if (data.stake) setInputStake(data.stake.toString());
      if (data.bookmaker) {
        const bookie = bookmakers.find(b => b.name.toLowerCase() === data.bookmaker.toLowerCase());
        updatedData.bookmaker = bookie ? bookie.name : data.bookmaker;
      }
      if (data.sport) {
        const matchedSport = SPORTS.find(s => s.toLowerCase() === data.sport.toLowerCase());
        if (matchedSport) updatedData.sport = matchedSport;
      }
      if (data.status) {
        if (data.status === 'WON') updatedData.status = BetStatus.WON;
        if (data.status === 'LOST') updatedData.status = BetStatus.LOST;
      }
      
      setFormData(updatedData);
    } catch (error: any) {
      console.error("Error extracting from image:", error);
      alert(error.message || "No se pudo extraer la información de la imagen. Por favor, inténtalo de nuevo o rellena manualmente.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      odds: parseFloat(inputOdds.replace(',', '.')),
      stake: parseFloat(inputStake.replace(',', '.')),
      manualProfit: formData.status === BetStatus.CASH_OUT ? parseFloat(inputManualProfit.replace(',', '.')) : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(226,0,26,0.15)]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-zinc-900 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-white italic">{initialData ? 'EDITAR' : 'NUEVA'} OPERACIÓN</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Control de auditoría</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* AI Screenshot Upload */}
          {!initialData && (
            <div className="relative group">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                disabled={isExtracting}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-[#e2001a]/5 hover:border-[#e2001a]/30 transition-all ${isExtracting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-6 h-6 text-[#e2001a] animate-spin" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Analizando captura...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-[#e2001a]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Subir Captura de Pantalla (IA Auto-registro)</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bankroll Destino</label>
            <select 
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" 
              value={formData.bankrollId} 
              onChange={(e) => setFormData({...formData, bankrollId: e.target.value})}
            >
              {!bankrolls.some(b => b.id === formData.bankrollId) && (
                <option value={formData.bankrollId}>Bankroll Principal (Auto-crear)</option>
              )}
              {bankrolls.filter(b => !b.archived || b.id === formData.bankrollId).map(b => (
                <option key={b.id} value={b.id}>{b.name}{b.archived ? ' (Archivado)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Casa de Apuestas</label>
              <select 
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" 
                value={enabledBookmakers.some(b => b.name === formData.bookmaker) ? formData.bookmaker : 'Otros'} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({...formData, bookmaker: val === 'Otros' ? '' : val});
                }}
              >
                {enabledBookmakers.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
                <option value="Otros">Otros (Manual)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mercado / Deporte</label>
              <select className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" value={formData.sport} onChange={(e) => setFormData({...formData, sport: e.target.value as Sport})}>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {(!enabledBookmakers.some(b => b.name === formData.bookmaker) || formData.bookmaker === '') && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre de la Casa (Manual)</label>
              <input 
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" 
                placeholder="Introduce el nombre de la casa" 
                value={formData.bookmaker} 
                onChange={(e) => setFormData({...formData, bookmaker: e.target.value})} 
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción del Pronóstico</label>
            <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" placeholder="Ej: Real Madrid Gana y +2.5 goles" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="bg-zinc-950 rounded-3xl border border-white/5 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cuota</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-4 text-xl font-black text-white text-center transition-all focus:border-[#e2001a]" 
                      value={inputOdds} 
                      onChange={(e) => setInputOdds(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Importe (Stake)</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900 border border-[#e2001a]/50 rounded-2xl px-4 py-4 text-xl font-black text-white text-center transition-all focus:border-[#e2001a]" 
                      value={inputStake} 
                      onChange={(e) => setInputStake(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Estado Actual</label>
                    <select className="w-full h-[60px] bg-zinc-900 border border-white/5 rounded-2xl px-2 text-[10px] font-black text-white uppercase text-center outline-none focus:border-white/20 transition-all" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as BetStatus})}>
                        <option value={BetStatus.PENDING}>⌛ PENDIENTE</option>
                        <option value={BetStatus.WON}>✅ Ganada</option>
                        <option value={BetStatus.LOST}>❌ Perdida</option>
                        <option value={BetStatus.CASH_OUT}>💰 CASH OUT</option>
                        <option value={BetStatus.REFUNDED}>🔄 REEMBOLSADA</option>
                        <option value={BetStatus.CANCELLED}>🚫 ANULADA</option>
                    </select>
                </div>
            </div>

            {formData.status === BetStatus.CASH_OUT && (
                <div className="pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Banknote size={12} /> Total Cobrado/Retirado (€)
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full bg-blue-500/5 border border-blue-500/20 rounded-2xl px-6 py-4 text-2xl font-black text-blue-400 text-center outline-none focus:border-blue-500/50" 
                                placeholder="Ej: 162.00 para cobrar 12€ de beneficio en apuesta de 150€"
                                value={inputManualProfit} 
                                onChange={(e) => setInputManualProfit(e.target.value)} 
                            />
                            <p className="text-[8px] text-blue-400/50 font-bold text-center mt-2 uppercase">Introduce el importe TOTAL que has retirado. El sistema calculará el beneficio/pérdida restando tu apuesta automáticamente.</p>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <button type="submit" className="w-full py-6 bg-gradient-to-r from-[#e2001a] to-[#920011] rounded-2xl text-xs font-black text-white shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em]">
            {initialData ? 'GUARDAR ACTUALIZACIÓN' : 'REGISTRAR OPERACIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBetModal;
