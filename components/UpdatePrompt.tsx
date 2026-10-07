/// <reference types="vite-plugin-pwa/react" />
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, WifiOff, X } from 'lucide-react';

/**
 * Registra el service worker (app instalable / sin conexión) y avisa cuando:
 * - hay una versión nueva publicada: botón para actualizar;
 * - la app ya está lista para usarse sin conexión (solo la primera vez).
 */
const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    // Comprueba si hay versión nueva cada hora mientras la app está abierta
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh && !offlineReady) return null;

  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[200] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${needRefresh ? 'bg-[#e2001a]/15 text-[#e2001a]' : 'bg-emerald-500/15 text-emerald-400'}`}>
        {needRefresh ? <RefreshCw size={18} /> : <WifiOff size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-white">{needRefresh ? 'Nueva versión disponible' : 'Lista para usar sin conexión'}</p>
        <p className="text-[10px] font-bold text-slate-500">{needRefresh ? 'Actualiza para ver los últimos cambios.' : 'BetTrack ya funciona aunque no tengas internet.'}</p>
      </div>
      {needRefresh && (
        <button onClick={() => updateServiceWorker(true)} className="bg-[#e2001a] text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-red-700 transition-all shrink-0">
          Actualizar
        </button>
      )}
      <button onClick={close} aria-label="Cerrar" className="text-slate-500 hover:text-white shrink-0"><X size={16} /></button>
    </div>
  );
};

export default UpdatePrompt;
