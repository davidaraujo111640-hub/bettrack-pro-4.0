
import React, { useEffect } from 'react';
import { CircleCheck, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-400" />;
      default: return <CircleCheck className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 min-w-[280px]">
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">{message}</p>
          <div className="h-0.5 w-full bg-white/5 mt-2 overflow-hidden rounded-full">
            <div className="h-full bg-[#e2001a] animate-toast-progress"></div>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors">
          <X size={12} />
        </button>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-progress { animation: toast-progress 3s linear forwards; }
      `}} />
    </div>
  );
};

export default Toast;
