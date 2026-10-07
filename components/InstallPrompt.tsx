import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { detectInstallKind, InstallKind } from '../src/utils/installHelp';

/** Evento de instalación de Chrome/Edge (aún no está en los tipos estándar de TypeScript) */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'bt_install_dismissed';

// El navegador lanza beforeinstallprompt una sola vez y puede hacerlo antes de que el
// componente exista: se guarda aquí en cuanto se carga este archivo.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach(l => l());
  });
}

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch { return false; }
}

function currentKind(): InstallKind {
  const nav = navigator as Navigator & { standalone?: boolean };
  return detectInstallKind({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true,
  });
}

/**
 * Aviso para instalar la app en la pantalla de acceso:
 * - Chrome/Edge: botón "Instalar app" que abre el cuadro de instalación.
 * - iPhone/iPad: guía de pasos en Safari (Apple no permite un botón automático).
 * No sale si ya está instalada o si se ha cerrado con la ✕.
 */
const InstallPrompt: React.FC = () => {
  const [, refresh] = useState(0);
  const [dismissed, setDismissed] = useState(isDismissed);

  useEffect(() => {
    const l = () => refresh(n => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const kind = currentKind();
  if (dismissed || kind === 'installed') return null;
  if (kind === 'other' && !deferredPrompt) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* sin almacenamiento: solo se oculta ahora */ }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    const p = deferredPrompt;
    deferredPrompt = null; // cada evento solo se puede usar una vez
    await p.prompt();
    await p.userChoice;
    refresh(n => n + 1);
  };

  return (
    <div className="mt-6 glass-panel rounded-3xl p-5 border-white/5 relative">
      <button onClick={dismiss} aria-label="Cerrar" className="absolute top-3 right-3 text-slate-600 hover:text-white transition-colors">
        <X size={14} />
      </button>
      <div className="flex items-start gap-4 pr-4">
        <div className="w-10 h-10 rounded-xl bg-[#e2001a]/15 text-[#e2001a] flex items-center justify-center shrink-0">
          <Download size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-white uppercase tracking-wide">Instala la app</p>
          {kind === 'ios' ? (
            <>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Ábrela en <span className="text-slate-300">Safari</span> y sigue estos pasos:</p>
              <ol className="text-[11px] font-bold text-slate-300 mt-2 space-y-1.5">
                <li className="flex items-start gap-2"><span className="whitespace-nowrap">1. Toca</span> <Share size={13} className="text-[#007aff] shrink-0 mt-0.5" /> <span>Compartir</span></li>
                <li className="flex items-start gap-2"><span className="whitespace-nowrap">2. Elige</span> <PlusSquare size={13} className="shrink-0 mt-0.5" /> <span>«Añadir a pantalla de inicio»</span></li>
              </ol>
            </>
          ) : (
            <>
              <p className="text-[10px] font-bold text-slate-500 mt-1">Se abre a pantalla completa, con su icono y funciona sin conexión.</p>
              <button onClick={install} className="mt-3 bg-[#e2001a] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-red-700 active:scale-95 transition-all">
                Instalar app
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
