
import React, { useState, useRef, useEffect } from 'react';
import { Bet, BetStatus, BetLeg, LegStatus, Sport, Bankroll, Bookmaker } from '../types';
import { Camera, Loader2, X, Banknote, AlertTriangle, ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import { parseDecimal, validateBetForm, MIN_ODDS } from '../src/utils/betMath';
import { comboOdds, defaultParlayDescription, deriveParlayStatus, isParlay, LEG_STATUS_LABELS, LEG_STATUSES, MIN_LEGS } from '../src/utils/parlay';
import BookmakerSelect from './BookmakerSelect';
import SportSelect from './SportSelect';
import { prepareImage } from '../src/utils/imagePrep';

interface AddBetModalProps {
  bankrolls: Bankroll[];
  bookmakers: Bookmaker[];
  activeBankrollId: string;
  onClose: () => void;
  onSubmit: (bet: Omit<Bet, 'id' | 'profit'> & { manualProfit?: number }) => void;
  initialData?: Bet;
  /** Casas más usadas, para mostrarlas arriba en el selector */
  recentBookmakers?: string[];
  /** Deportes más usados, para mostrarlos arriba en el selector */
  recentSports?: string[];
  /** Imagen de apuesta compartida desde otra app: se analiza al abrir el formulario */
  sharedImage?: File | null;
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

const AddBetModal: React.FC<AddBetModalProps> = ({ bankrolls, bookmakers, activeBankrollId, onClose, onSubmit, initialData, recentBookmakers, recentSports, sharedImage }) => {
  const enabledBookmakers = bookmakers.filter(b => b.enabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [inputOdds, setInputOdds] = useState(initialData ? initialData.odds.toString() : '1.80');
  const [inputStake, setInputStake] = useState(initialData ? initialData.stake.toString() : '10');
  const [inputManualProfit, setInputManualProfit] = useState(initialData ? (initialData.status === BetStatus.CASH_OUT ? (initialData.profit + (initialData.freebet ? 0 : initialData.stake)) : initialData.profit || 0).toString() : '0');

  // Combinada: varias selecciones en una sola apuesta. La cuota total se calcula sola, salvo que se edite a mano
  interface LegDraft { description: string; odds: string; status: LegStatus }
  const emptyLeg = (): LegDraft => ({ description: '', odds: '', status: 'PENDING' });
  const [isParlayMode, setIsParlayMode] = useState(() => !!initialData && isParlay(initialData));
  const [legDrafts, setLegDrafts] = useState<LegDraft[]>(() =>
    initialData?.legs?.length
      ? initialData.legs.map(l => ({ description: l.description, odds: String(l.odds), status: l.status }))
      : [emptyLeg(), emptyLeg()]
  );
  const [oddsEdited, setOddsEdited] = useState(!!initialData);

  const draftsToLegs = (drafts: LegDraft[]): BetLeg[] =>
    drafts.map(l => ({ description: l.description.trim(), odds: parseDecimal(l.odds), status: l.status }));
  const autoOdds = (drafts: LegDraft[]): number | null => {
    const legs = draftsToLegs(drafts);
    return legs.length > 0 && legs.every(l => Number.isFinite(l.odds) && l.odds > 0) ? comboOdds(legs) : null;
  };
  const updateLeg = (index: number, patch: Partial<LegDraft>) =>
    setLegDrafts(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        date: initialData.date,
        bankrollId: initialData.bankrollId,
        bookmaker: initialData.bookmaker,
        sport: initialData.sport,
        status: initialData.status,
        description: initialData.description,
        freebet: !!initialData.freebet,
      };
    }
    return {
      date: new Date().toISOString().split('T')[0],
      bankrollId: activeBankrollId === 'all' ? (bankrolls.find(b => !b.archived)?.id || 'default') : activeBankrollId,
      // Por defecto, la casa más usada (si sigue visible); si no, la primera de la lista
      bookmaker: recentBookmakers?.find(n => enabledBookmakers.some(b => b.name === n)) ?? (enabledBookmakers.length > 0 ? enabledBookmakers[0].name : 'Otros'),
      sport: 'Fútbol' as Sport,
      status: BetStatus.PENDING,
      description: '',
      freebet: false,
    };
  });

  // Mientras la cuota total no se haya tocado a mano, sigue al producto de las selecciones
  useEffect(() => {
    if (!isParlayMode || oddsEdited) return;
    const total = autoOdds(legDrafts);
    if (total !== null && total > 1) setInputOdds(total.toFixed(2));
  }, [legDrafts, isParlayMode, oddsEdited]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lee una imagen de apuesta (subida, pegada, arrastrada o compartida desde otra app) y rellena el formulario
  const analyzeImage = async (file: Blob) => {
    setIsExtracting(true);
    setExtractError(null);
    try {
      const { base64, mimeType } = await prepareImage(file);

      const response = await fetch('/api/extract-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64, mimeType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to extract data');
      }

      const data = await response.json();

      // Se parte del formulario actual (no del que había al lanzar el análisis, que puede haber cambiado)
      setFormData(prev => {
        const updated = { ...prev };
        if (data.match || data.selection) {
          updated.description = `${data.match || ''} - ${data.selection || ''}`.trim();
          if (updated.description.startsWith(' - ')) updated.description = updated.description.substring(3);
        }
        if (data.bookmaker) {
          const bookie = bookmakers.find(b => b.name.toLowerCase() === data.bookmaker.toLowerCase());
          updated.bookmaker = bookie ? bookie.name : data.bookmaker;
        }
        if (data.sport) {
          const matchedSport = SPORTS.find(s => s.toLowerCase() === data.sport.toLowerCase());
          if (matchedSport) updated.sport = matchedSport;
        }
        if (data.status === 'WON') updated.status = BetStatus.WON;
        if (data.status === 'LOST') updated.status = BetStatus.LOST;
        return updated;
      });
      if (Array.isArray(data.legs) && data.legs.length >= MIN_LEGS) {
        setIsParlayMode(true);
        setLegDrafts(data.legs.map((l: { description?: string; odds?: number | null }) => ({
          description: l.description ?? '',
          odds: l.odds && l.odds > 1 ? String(l.odds) : '',
          status: 'PENDING' as LegStatus,
        })));
        setOddsEdited(!!data.odds);
      }
      if (data.odds) setInputOdds(data.odds.toString());
      if (data.stake) setInputStake(data.stake.toString());
    } catch (error) {
      console.error("Error extracting from image:", error);
      setExtractError(error instanceof Error && error.message ? error.message : "No se pudo extraer la información de la imagen. Inténtalo de nuevo o rellena los datos a mano.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Los eventos de pegar y de imagen compartida llaman siempre a la versión más reciente
  const analyzeImageRef = useRef(analyzeImage);
  analyzeImageRef.current = analyzeImage;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await analyzeImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const firstImage = (files?: FileList | null) => Array.from(files ?? []).find(f => f.type.startsWith('image/'));

  // Ctrl+V / pegar con la ventana abierta: si lo copiado es una imagen, se analiza
  useEffect(() => {
    if (initialData) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = firstImage(e.clipboardData?.files);
      if (!file) return;
      e.preventDefault();
      analyzeImageRef.current(file);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [initialData]);

  // Imagen compartida desde otra app (menú Compartir de Android)
  const analyzedShared = useRef<File | null>(null);
  useEffect(() => {
    if (!sharedImage || initialData || analyzedShared.current === sharedImage) return;
    analyzedShared.current = sharedImage;
    analyzeImageRef.current(sharedImage);
  }, [sharedImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Botón "Pegar imagen": lee el portapapeles (en iPhone no hay menú Compartir hacia la app, esta es la vía)
  const pasteFromClipboard = async () => {
    setExtractError(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          await analyzeImage(await item.getType(type));
          return;
        }
      }
      setExtractError('No hay ninguna imagen copiada. Copia la imagen de la apuesta y vuelve a pulsar.');
    } catch {
      setExtractError('No se ha podido leer el portapapeles. Permite el acceso o sube la imagen con el botón de arriba.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateBetForm({
      date: formData.date,
      bookmaker: formData.bookmaker,
      status: formData.status,
      odds: inputOdds,
      stake: inputStake,
      cashOutAmount: inputManualProfit,
    });
    if (error) {
      setFormError(error);
      return;
    }
    if (isParlayMode) {
      if (legDrafts.length < MIN_LEGS) {
        setFormError(`Una combinada necesita al menos ${MIN_LEGS} selecciones.`);
        return;
      }
      for (let i = 0; i < legDrafts.length; i++) {
        const odds = parseDecimal(legDrafts[i].odds);
        if (Number.isNaN(odds) || odds < MIN_ODDS) {
          setFormError(`La cuota de la selección ${i + 1} debe ser un número mayor que 1 (por ejemplo 1.85).`);
          return;
        }
      }
    }
    setFormError(null);

    const legs = isParlayMode ? draftsToLegs(legDrafts) : undefined;
    // Cash out y anulada se eligen a mano; en el resto, el estado sale de las selecciones
    const manualStatus = formData.status === BetStatus.CASH_OUT || formData.status === BetStatus.CANCELLED;
    const status = legs && !manualStatus ? deriveParlayStatus(legs) : formData.status;
    const hasVoid = !!legs && legs.some(l => l.status === 'VOID');
    onSubmit({
      ...formData,
      status,
      description: formData.description.trim() || (legs ? defaultParlayDescription(legs) : ''),
      bookmaker: formData.bookmaker.trim(),
      odds: legs && hasVoid && !manualStatus ? comboOdds(legs) : parseDecimal(inputOdds),
      stake: parseDecimal(inputStake),
      legs,
      manualProfit: formData.status === BetStatus.CASH_OUT ? parseDecimal(inputManualProfit) : undefined
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
            <div
              className="relative group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const file = firstImage(e.dataTransfer?.files); if (file) { e.preventDefault(); analyzeImage(file); } }}
            >
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
                    <span className="text-[9px] font-bold text-slate-500">También puedes arrastrarla aquí o pegarla con Ctrl+V</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isExtracting}
                onClick={pasteFromClipboard}
                className="mt-2 w-full py-3 rounded-2xl flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                <ClipboardPaste className="w-4 h-4" /> Pegar imagen copiada
              </button>
              {extractError && (
                <p role="alert" className="mt-3 text-[#e2001a] text-[10px] font-black uppercase text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />{extractError}
                </p>
              )}
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
              <BookmakerSelect
                bookmakers={enabledBookmakers}
                value={enabledBookmakers.some(b => b.name === formData.bookmaker) ? formData.bookmaker : ''}
                onChange={(name) => setFormData({ ...formData, bookmaker: name })}
                recent={recentBookmakers}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mercado / Deporte</label>
              <SportSelect
                sports={SPORTS}
                value={formData.sport}
                onChange={(sport) => setFormData({ ...formData, sport })}
                recent={recentSports}
              />
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

          {/* Tipo de apuesta: simple o combinada */}
          <div role="tablist" aria-label="Tipo de apuesta" className="grid grid-cols-2 gap-1 p-1 bg-zinc-900 border border-white/10 rounded-2xl">
            {([false, true] as const).map(parlay => (
              <button
                key={String(parlay)}
                type="button"
                role="tab"
                aria-selected={isParlayMode === parlay}
                onClick={() => setIsParlayMode(parlay)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isParlayMode === parlay ? 'bg-[#e2001a] text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {parlay ? 'Combinada' : 'Simple'}
              </button>
            ))}
          </div>

          {isParlayMode && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecciones ({legDrafts.length})</span>
                {autoOdds(legDrafts) !== null && (
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota total <span className="text-white">{autoOdds(legDrafts)!.toFixed(2)}</span></span>
                )}
              </div>
              {legDrafts.map((leg, i) => (
                <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <span className="w-6 text-center text-[10px] font-black text-slate-600 shrink-0">{i + 1}</span>
                  <input
                    aria-label={`Selección ${i + 1}`}
                    className="flex-1 basis-[calc(100%-2rem)] sm:basis-0 min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-3 py-3 text-sm font-bold text-white outline-none focus:border-[#e2001a]"
                    placeholder="Ej: Real Madrid gana"
                    value={leg.description}
                    onChange={(e) => updateLeg(i, { description: e.target.value })}
                  />
                  <input
                    aria-label={`Cuota de la selección ${i + 1}`}
                    inputMode="decimal"
                    className="w-24 sm:w-20 ml-8 sm:ml-0 bg-zinc-900 border border-white/10 rounded-xl px-2 py-3 text-sm font-black text-white text-center outline-none focus:border-[#e2001a]"
                    placeholder="Cuota"
                    value={leg.odds}
                    onChange={(e) => updateLeg(i, { odds: e.target.value })}
                  />
                  <select
                    aria-label={`Estado de la selección ${i + 1}`}
                    className="flex-1 sm:flex-none sm:w-[92px] min-w-0 bg-zinc-900 border border-white/10 rounded-xl px-1 py-3 text-[10px] font-black text-white uppercase outline-none focus:border-white/20"
                    value={leg.status}
                    onChange={(e) => updateLeg(i, { status: e.target.value as LegStatus })}
                  >
                    {LEG_STATUSES.map(st => <option key={st} value={st}>{LEG_STATUS_LABELS[st]}</option>)}
                  </select>
                  <button
                    type="button"
                    aria-label={`Quitar selección ${i + 1}`}
                    disabled={legDrafts.length <= MIN_LEGS}
                    onClick={() => setLegDrafts(prev => prev.filter((_, idx) => idx !== i))}
                    className="w-9 h-9 rounded-xl text-slate-500 hover:text-[#e2001a] hover:bg-white/5 disabled:opacity-30 disabled:hover:text-slate-500 flex items-center justify-center shrink-0 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setLegDrafts(prev => [...prev, emptyLeg()])}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-slate-400 hover:text-white hover:border-white/30 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={14} /> Añadir selección
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{isParlayMode ? 'Descripción (opcional)' : 'Descripción del Pronóstico'}</label>
            <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-[#e2001a]" placeholder={isParlayMode ? 'Si la dejas vacía se crea con las selecciones' : 'Ej: Real Madrid Gana y +2.5 goles'} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="bg-zinc-950 rounded-3xl border border-white/5 p-6 space-y-4">
            {/* Freebet: apuesta gratis (el importe no resta si se pierde) */}
            <button
              type="button"
              role="switch"
              aria-checked={formData.freebet}
              onClick={() => setFormData({ ...formData, freebet: !formData.freebet })}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all ${formData.freebet ? 'bg-violet-500/10 border-violet-500/40' : 'bg-zinc-900 border-white/5 hover:border-white/15'}`}
            >
              <span className="flex items-center gap-3 text-left">
                <span className={`px-2 py-1 rounded-lg text-[11px] font-black tracking-wider ${formData.freebet ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>FB</span>
                <span>
                  <span className="block text-[11px] font-black text-white uppercase tracking-widest">Freebet / apuesta gratis</span>
                  <span className="block text-[9px] font-bold text-zinc-500">Si se pierde no resta el importe; si se gana, solo cuenta la ganancia neta</span>
                </span>
              </span>
              <span className={`relative w-10 h-6 rounded-full shrink-0 transition-all ${formData.freebet ? 'bg-violet-500' : 'bg-zinc-700'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.freebet ? 'left-5' : 'left-1'}`} />
              </span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{isParlayMode ? 'Cuota total' : 'Cuota'}</label>
                    <input
                      type="text"
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-4 py-4 text-xl font-black text-white text-center transition-all focus:border-[#e2001a]"
                      value={inputOdds}
                      onChange={(e) => { setInputOdds(e.target.value); if (isParlayMode) setOddsEdited(true); }}
                    />
                    {isParlayMode && oddsEdited && autoOdds(legDrafts) !== null && (
                      <button type="button" onClick={() => { setOddsEdited(false); setInputOdds(autoOdds(legDrafts)!.toFixed(2)); }} className="w-full text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
                        Usar {autoOdds(legDrafts)!.toFixed(2)} (producto)
                      </button>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formData.freebet ? 'Importe freebet' : 'Importe (Stake)'}</label>
                    <input
                      type="text"
                      className={`w-full bg-zinc-900 border rounded-2xl px-4 py-4 text-xl font-black text-center transition-all ${formData.freebet ? 'border-violet-500/50 text-violet-300 focus:border-violet-500' : 'border-[#e2001a]/50 text-white focus:border-[#e2001a]'}`}
                      value={inputStake}
                      onChange={(e) => setInputStake(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Estado Actual</label>
                    {isParlayMode ? (
                      <select
                        className="w-full h-[60px] bg-zinc-900 border border-white/5 rounded-2xl px-2 text-[10px] font-black text-white uppercase text-center outline-none focus:border-white/20 transition-all"
                        value={formData.status === BetStatus.CASH_OUT || formData.status === BetStatus.CANCELLED ? formData.status : 'AUTO'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value === 'AUTO' ? BetStatus.PENDING : e.target.value as BetStatus })}
                      >
                        <option value="AUTO">⚙️ Según selecciones</option>
                        <option value={BetStatus.CASH_OUT}>💰 CASH OUT</option>
                        <option value={BetStatus.CANCELLED}>🚫 ANULADA</option>
                      </select>
                    ) : (
                    <select className="w-full h-[60px] bg-zinc-900 border border-white/5 rounded-2xl px-2 text-[10px] font-black text-white uppercase text-center outline-none focus:border-white/20 transition-all" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as BetStatus})}>
                        <option value={BetStatus.PENDING}>⌛ PENDIENTE</option>
                        <option value={BetStatus.WON}>✅ Ganada</option>
                        <option value={BetStatus.LOST}>❌ Perdida</option>
                        <option value={BetStatus.CASH_OUT}>💰 CASH OUT</option>
                        <option value={BetStatus.REFUNDED}>🔄 REEMBOLSADA</option>
                        <option value={BetStatus.CANCELLED}>🚫 ANULADA</option>
                    </select>
                    )}
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
                            <p className="text-[8px] text-blue-400/50 font-bold text-center mt-2 uppercase">Introduce el importe TOTAL que has retirado. {formData.freebet ? 'Al ser freebet, todo lo cobrado cuenta como beneficio.' : 'El sistema calculará el beneficio/pérdida restando tu apuesta automáticamente.'}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-[#e2001a] text-[10px] font-black uppercase text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />{formError}
            </p>
          )}

          <button type="submit" className="w-full py-6 bg-gradient-to-r from-[#e2001a] to-[#920011] rounded-2xl text-xs font-black text-white shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em]">
            {initialData ? 'GUARDAR ACTUALIZACIÓN' : 'REGISTRAR OPERACIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBetModal;
