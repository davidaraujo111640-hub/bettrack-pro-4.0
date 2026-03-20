
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 border-white/10 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
            type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
          }`}>
            <i className={`fas ${type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-2xl`}></i>
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tight">{title}</h3>
          <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                type === 'danger' 
                ? 'bg-red-600 text-white shadow-xl shadow-red-900/40 hover:bg-red-500' 
                : 'bg-white text-black hover:bg-slate-200'
              }`}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-4 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
