
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bet } from '../types';

interface AIInsightsProps {
  bets: Bet[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ bets }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [sources, setSources] = useState<{ web?: { uri: string; title?: string } }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('ALL');

  const sports = Array.from(new Set(bets.map(b => b.sport))).sort();
  const bookmakers = Array.from(new Set(bets.map(b => b.bookmaker))).sort();

  React.useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(!!process.env.GEMINI_API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const generateInsights = async () => {
    if (bets.length < 3) return;
    
    // If we need a paid model and don't have a key, prompt for it
    if (!hasKey && window.aistudio) {
        await handleOpenKeySelector();
    }

    setIsLoading(true);
    setInsight(null);
    setSources([]);

    try {
      // Use GEMINI_API_KEY for free tier or API_KEY if selected
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("No API Key found. Please select an API key.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const filteredBets = bets.filter(b => 
        (selectedSport === 'ALL' || b.sport === selectedSport) &&
        (selectedBookmaker === 'ALL' || b.bookmaker === selectedBookmaker)
      );

      const focusText = [];
      if (selectedSport !== 'ALL') focusText.push(`deporte: ${selectedSport}`);
      if (selectedBookmaker !== 'ALL') focusText.push(`casa de apuestas: ${selectedBookmaker}`);
      const focusMessage = focusText.length > 0 ? `Céntrate especialmente en el análisis de ${focusText.join(' y ')}.` : '';

      const prompt = `Actúa como un experto analista de apuestas profesional (Tipster Pro). 
      Analiza mi historial reciente de apuestas: ${JSON.stringify(filteredBets.slice(0, 50))}. 
      ${focusMessage}
      
      Instrucciones:
      1. Evalúa el ROI y el Yield actual para este conjunto de datos. Usa el emoji 📈.
      2. Identifica patrones ganadores (cuotas o mercados específicos donde soy más rentable). Usa el emoji 🎯.
      3. Señala errores críticos (ej: exceso de riesgo/stake, apuestas a cuotas sin valor). Usa el emoji ⚠️.
      4. Usa la herramienta de búsqueda para darme consejos sobre eventos deportivos actuales que encajen con mi perfil y los filtros seleccionados. Usa el emoji 💡.
      
      IMPORTANTE: 
      - Responde en español con un tono motivador pero profesional.
      - NO uses negritas con asteriscos (ej: **texto**). 
      - Usa EMOJIS al inicio de cada punto clave para que sea visualmente atractivo.
      - Estructura la respuesta con títulos claros usando #.`;

      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      // Correct: Access the response text property directly.
      const text = response.text;
      setInsight(text || "No se ha podido generar un análisis detallado en este momento.");
      
      // Always extract URLs from groundingChunks as per Search Grounding guidelines.
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks as { web?: { uri: string; title?: string } }[]);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error("AI Error:", err);
      if (err.message?.includes("API Key") || err.message?.includes("API_KEY")) {
        setInsight("Error: La clave API no está configurada. Por favor, asegúrate de tener una clave válida.");
        if (window.aistudio) {
            setHasKey(false);
        }
      } else {
        setInsight("Lo siento, el Analista Pro está saturado. Por favor, inténtalo de nuevo en unos minutos.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderInsightLine = (line: string, index: number) => {
    if (!line.trim()) return null;

    // Header styling
    if (line.startsWith('#')) {
      return (
        <h3 key={index} className="text-xl font-black text-white mt-8 mb-4 flex items-center gap-3 border-b border-white/5 pb-2">
          <span className="w-1.5 h-6 bg-[#ffcc00] rounded-full"></span>
          {line.replace(/^#+\s*/, '')}
        </h3>
      );
    }

    // List item or emoji line styling
    const emojiRegex = /^([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u;
    const match = line.match(emojiRegex);

    if (match) {
      return (
        <div key={index} className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-3 hover:bg-white/10 transition-all group">
          <div className="flex gap-3">
            <span className="text-xl group-hover:scale-125 transition-transform">{match[1]}</span>
            <p className="text-slate-300 font-medium leading-relaxed">
              {line.replace(emojiRegex, '').trim()}
            </p>
          </div>
        </div>
      );
    }

    return (
      <p key={index} className="text-slate-400 font-medium leading-relaxed mb-4 pl-4 border-l border-white/5">
        {line}
      </p>
    );
  };

  return (
    <div className="space-y-8 px-4 md:px-0 pb-20">
      <header className="flex flex-col sm:flex-row items-center justify-between bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 gap-4">
        <div>
          <h2 className="text-3xl font-black italic text-white flex items-center gap-3">
            Analista <span className="text-[#ffcc00]">PRO AI</span>
          </h2>
          <p className="text-slate-500 text-sm font-bold mt-1">Análisis táctico basado en tus datos reales.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-zinc-800 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#ffcc00]/50 transition-all flex-1 sm:flex-none"
            >
              <option value="ALL">Todos los Deportes</option>
              {sports.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={selectedBookmaker}
              onChange={(e) => setSelectedBookmaker(e.target.value)}
              className="bg-zinc-800 border border-white/10 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#ffcc00]/50 transition-all flex-1 sm:flex-none"
            >
              <option value="ALL">Todas las Casas</option>
              {bookmakers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          
          <button 
            onClick={generateInsights} 
            disabled={isLoading || bets.length < 3} 
            className="w-full sm:w-auto bg-gradient-to-r from-[#e2001a] to-[#ffcc00] text-black font-black px-8 py-4 rounded-2xl disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-900/20"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>Escaneando...</span>
              </div>
            ) : 'Generar Reporte Pro'}
          </button>
        </div>
      </header>

      <div className="glass-panel p-8 lg:p-12 rounded-[2.5rem] border-[#ffcc00]/10 min-h-[400px] relative overflow-hidden">
        {isLoading && (
            <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-md flex flex-col items-center justify-center z-20">
                <div className="w-16 h-16 border-4 border-[#ffcc00]/20 border-t-[#ffcc00] rounded-full animate-spin"></div>
                <p className="mt-6 text-[#ffcc00] font-black uppercase tracking-widest text-xs animate-pulse">Calculando probabilidades y valor...</p>
            </div>
        )}

        {insight ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-none">
              {insight.split('\n').map((line, i) => renderInsightLine(line, i))}
            </div>
            
            {sources.length > 0 && (
              <div className="pt-8 mt-8 border-t border-white/5">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Fuentes de mercado consultadas</h4>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, i) => src.web && (
                    <a key={i} href={src.web.uri} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 hover:text-white hover:bg-[#e2001a]/20 transition-all flex items-center gap-2">
                      <i className="fas fa-globe-europe"></i>
                      {src.web.title || 'Referencia externa'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20">
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 shadow-inner">
              <i className="fas fa-brain text-4xl text-zinc-700"></i>
            </div>
            <h3 className="text-xl font-black text-white italic mb-2">Potencia tu Bankroll con IA</h3>
            <p className="text-slate-500 font-bold text-sm max-w-xs leading-relaxed">
              {bets.length < 3 
                ? 'Registra al menos 3 apuestas para que pueda analizar tu estilo de juego.' 
                : 'Analizaré tu rendimiento y buscaré noticias que puedan afectar tus próximos pronósticos.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
