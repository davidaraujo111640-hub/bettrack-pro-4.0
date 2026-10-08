import React from 'react';
import { RefreshCw } from 'lucide-react';
import DataRescue from './DataRescue';

interface State {
  failed: boolean;
}

/**
 * Red de seguridad: si algo falla al dibujar la app, en vez de dejar la pantalla en negro se muestra
 * un aviso con un botón para recargar y la opción de descargar los datos guardados en el dispositivo.
 */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Error en la app:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-[2.5rem] p-8 text-center border-white/5">
            <h1 className="text-lg font-black text-white uppercase italic">Algo ha fallado</h1>
            <p className="text-xs font-bold text-slate-400 mt-3">
              La app ha tenido un problema inesperado. Tus datos no se han perdido: recarga la página para seguir.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-4 bg-[#e2001a] rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"
            >
              <RefreshCw size={14} /> Recargar
            </button>
          </div>
          <DataRescue />
        </div>
      </div>
    );
  }
}
