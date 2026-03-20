
import React from 'react';
import { Bookmaker } from '../types';
import { getBookmakerIcon, getFallbackIcon, getBookmakerBrand } from '../src/utils/bookmakers';
import { renderBookmakerName } from '../src/utils/bookmakerStyles';

interface BookmakerManagerProps {
  bookmakers: Bookmaker[];
  onUpdate: (bookmakers: Bookmaker[]) => void;
}

const BookmakerManager: React.FC<BookmakerManagerProps> = ({ bookmakers, onUpdate }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newBookmakerName, setNewBookmakerName] = React.useState('');

  const toggleBookmaker = (id: string) => {
    onUpdate(bookmakers.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };

  const toggleAll = (enable: boolean) => {
    onUpdate(bookmakers.map(b => ({ ...b, enabled: enable })));
  };

  const handleAddBookmaker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmakerName.trim()) return;

    const newBook: Bookmaker = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBookmakerName.trim(),
      icon: getBookmakerIcon(newBookmakerName.trim()),
      enabled: true
    };

    onUpdate([...bookmakers, newBook].sort((a, b) => a.name.localeCompare(b.name)));
    setNewBookmakerName('');
    setIsAdding(false);
  };

  const handleIconUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onUpdate(bookmakers.map(b => b.id === id ? { ...b, icon: base64String } : b));
    };
    reader.readAsDataURL(file);
  };

  const enabledCount = bookmakers.filter(b => b.enabled).length;

  return (
    <div className="space-y-8 px-4 md:px-0 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full">
          <span className="text-[#e2001a] font-black text-[10px] uppercase tracking-[0.5em]">CONFIGURACIÓN</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-2 italic">CASAS DE APUESTAS</h2>
          <p className="text-slate-500 font-bold text-[10px] md:text-xs mt-2">Activa o desactiva las plataformas que quieres ver en tus desplegables</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={() => toggleAll(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
            >
              Activar
            </button>
            <button 
              onClick={() => toggleAll(false)}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              Desactivar
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              <i className="fas fa-plus mr-2"></i> Añadir
            </button>
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl px-6 py-3 flex items-center gap-3 w-fit">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{enabledCount} ACTIVAS</span>
        </div>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-white italic tracking-tight mb-6 uppercase">Añadir Nueva Casa</h3>
            <form onSubmit={handleAddBookmaker} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre de la Casa</label>
                <input 
                  autoFocus
                  type="text"
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a] transition-all" 
                  placeholder="Ej: MyBet" 
                  value={newBookmakerName}
                  onChange={(e) => setNewBookmakerName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="bg-zinc-900 text-white font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-[10px]"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmakers.map(bookmaker => (
          <button 
            key={bookmaker.id} 
            onClick={() => toggleBookmaker(bookmaker.id)}
            className={`glass-panel rounded-3xl p-6 border transition-all flex items-center justify-between group text-left ${
              bookmaker.enabled 
              ? 'border-white/20 bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.02)]' 
              : 'border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="relative group/icon">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl bg-white/5">
                  <img 
                    src={bookmaker.icon} 
                    alt={bookmaker.name} 
                    className="w-full h-full object-contain p-2"
                    style={{ filter: getBookmakerBrand(bookmaker.name).logoFilter }}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackIcon(bookmaker.name);
                    }}
                  />
                </div>
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl">
                  <i className="fas fa-camera text-white text-xs"></i>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleIconUpload(bookmaker.id, e)}
                  />
                </label>
              </div>
              <div>
                <h4 className="font-black text-white uppercase italic tracking-tight">
                  {renderBookmakerName(bookmaker.name)}
                </h4>
                <span className={`text-[8px] font-black uppercase tracking-widest ${bookmaker.enabled ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {bookmaker.enabled ? 'VISIBLE' : 'OCULTA'}
                </span>
              </div>
            </div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              bookmaker.enabled ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'bg-zinc-800 text-slate-600'
            }`}>
              <i className={`fas ${bookmaker.enabled ? 'fa-check' : 'fa-power-off'} text-xs`}></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BookmakerManager;
