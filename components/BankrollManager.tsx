
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bankroll, Bet, BetStatus } from '../types';

interface BankrollManagerProps {
  bankrolls: Bankroll[];
  bets: Bet[];
  activeBankrollId: string;
  onUpdate: (banks: Bankroll[]) => void;
  onSelect: (id: string) => void;
}

const BankrollManager: React.FC<BankrollManagerProps> = ({ bankrolls, bets, activeBankrollId, onUpdate, onSelect }) => {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [editingBank, setEditingBank] = useState<Bankroll | null>(null);
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);
  const [newBank, setNewBank] = useState({ name: '', initialCapital: 1000 });
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBankrollStats = (bankrollId: string) => {
    const activeBankrolls = bankrolls.filter(b => !b.archived);
    const activeIds = new Set(activeBankrolls.map(b => b.id));
    
    const bankrollBets = bankrollId === 'all' 
      ? bets.filter(b => activeIds.has(b.bankrollId)) 
      : bets.filter(b => b.bankrollId === bankrollId);
      
    const closedBets = bankrollBets.filter(b => b.status !== BetStatus.PENDING);
    const profit = closedBets.reduce((acc, bet) => acc + (bet.profit || 0), 0);
    const totalStake = closedBets.reduce((acc, bet) => acc + (bet.stake || 0), 0);
    
    const initial = bankrollId === 'all' 
      ? activeBankrolls.reduce((acc, b) => acc + b.initialCapital, 0)
      : bankrolls.find(b => b.id === bankrollId)?.initialCapital || 0;
    
    return {
      initial,
      profit,
      current: initial + profit,
      yield: totalStake > 0 ? (profit / totalStake) * 100 : 0
    };
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    navigate('/bets');
  };

  const handleAdd = () => {
    if (!newBank.name) return;
    onUpdate([...bankrolls, { id: Math.random().toString(36).substr(2, 9), ...newBank, color: '#e2001a', archived: false }]);
    setIsAdding(false);
    setNewBank({ name: '', initialCapital: 1000 });
  };

  const handleEditSave = () => {
    if (!editingBank) return;
    onUpdate(bankrolls.map(b => b.id === editingBank.id ? editingBank : b));
    setEditingBank(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBankToDelete(id);
  };

  const confirmDelete = () => {
    if (!bankToDelete) return;
    onUpdate(bankrolls.filter(b => b.id !== bankToDelete));
    if (activeBankrollId === bankToDelete) onSelect('all');
    setBankToDelete(null);
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(bankrolls.map(b => b.id === id ? { ...b, archived: !b.archived } : b));
  };

  const exportData = () => {
    const data = {
      bankrolls: JSON.parse(localStorage.getItem('bt_bankrolls') || '[]'),
      bets: JSON.parse(localStorage.getItem('bet_track_bets') || '[]'),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BetTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.bankrolls && data.bets) {
          if (window.confirm('¿Estás seguro? Esto reemplazará todos tus datos actuales.')) {
            localStorage.setItem('bt_bankrolls', JSON.stringify(data.bankrolls));
            localStorage.setItem('bet_track_bets', JSON.stringify(data.bets));
            window.location.reload();
          }
        } else {
          alert('El archivo no tiene el formato correcto de BetTrack.');
        }
      } catch {
        alert('Error al leer el archivo.');
      }
    };
    reader.readAsText(file);
  };

  const visibleBankrolls = bankrolls.filter(b => showArchived ? b.archived : !b.archived);

  return (
    <div className="space-y-8 px-4 md:px-0 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[#e2001a] font-bold text-xs uppercase tracking-[0.3em]">GESTIÓN</span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">Bankrolls</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowArchived(!showArchived)} 
            className={`flex-1 sm:flex-none px-4 py-3 rounded-2xl font-black uppercase text-[10px] transition-all border ${
              showArchived ? 'bg-[#ffcc00] text-black border-[#ffcc00]' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <i className={`fas ${showArchived ? 'fa-box-open' : 'fa-archive'} mr-2`}></i> 
            {showArchived ? 'Activos' : 'Archivados'}
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 sm:flex-none bg-white/5 border border-white/5 text-slate-400 px-4 py-3 rounded-2xl font-black uppercase text-[10px] hover:text-white transition-all"
          >
            <i className="fas fa-file-import mr-2"></i> Importar
          </button>
          <button 
            onClick={exportData} 
            className="flex-1 sm:flex-none bg-white/5 border border-white/5 text-slate-400 px-4 py-3 rounded-2xl font-black uppercase text-[10px] hover:text-white transition-all"
          >
            <i className="fas fa-file-export mr-2"></i> Backup
          </button>
          <button 
            onClick={() => setIsAdding(true)} 
            className="w-full sm:w-auto bg-[#e2001a] text-white px-6 py-3 rounded-2xl font-black uppercase text-xs hover:bg-[#c10016] transition-all shadow-lg shadow-red-900/20"
          >
            Añadir Nuevo
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Global Especial - Solo se muestra cuando no estamos viendo archivados */}
        {!showArchived && (() => {
          const stats = getBankrollStats('all');
          return (
            <button 
              onClick={() => handleSelect('all')}
              className={`glass-panel rounded-[2rem] p-8 transition-all text-left flex flex-col relative group ${
                activeBankrollId === 'all' 
                  ? 'border-[#e2001a] ring-2 ring-[#e2001a]/20 bg-[#e2001a]/5' 
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              {activeBankrollId === 'all' && (
                <div className="absolute top-6 right-6 bg-[#e2001a] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <i className="fas fa-check"></i> Activo
                </div>
              )}
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 mb-6 flex items-center justify-center text-xl font-black text-slate-400 group-hover:text-white transition-colors">
                <i className="fas fa-globe"></i>
              </div>
              <h3 className="text-xl font-black text-white">Global</h3>
              
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Inicial</p>
                  <p className="text-sm font-black text-white">{stats.initial.toLocaleString()}€</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Profit</p>
                  <p className={`text-sm font-black ${stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()}€
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Yield</p>
                  <p className={`text-sm font-black ${stats.yield >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.yield.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Capital Actual</p>
                <p className="text-3xl font-black text-white mt-1">{stats.current.toLocaleString()}€</p>
              </div>
            </button>
          );
        })()}

        {visibleBankrolls.map(bank => {
          const stats = getBankrollStats(bank.id);
          return (
            <div 
              key={bank.id} 
              onClick={() => handleSelect(bank.id)}
              className={`glass-panel rounded-[2rem] p-6 md:p-8 transition-all text-left flex flex-col relative group cursor-pointer ${
                activeBankrollId === bank.id 
                  ? 'border-[#e2001a] ring-2 ring-[#e2001a]/20 bg-[#e2001a]/5' 
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="absolute top-6 right-6 flex gap-2">
                {activeBankrollId === bank.id && (
                  <div className="bg-[#e2001a] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <i className="fas fa-check"></i> Activo
                  </div>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingBank(bank); }}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                    title="Editar"
                  >
                    <i className="fas fa-edit text-[10px]"></i>
                  </button>
                  <button 
                    onClick={(e) => handleArchive(bank.id, e)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                    title={bank.archived ? "Desarchivar" : "Archivar"}
                  >
                    <i className={`fas ${bank.archived ? 'fa-box-open' : 'fa-archive'} text-[10px]`}></i>
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(bank.id, e)}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
                    title="Eliminar"
                  >
                    <i className="fas fa-trash text-[10px]"></i>
                  </button>
                </div>
              </div>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#e2001a] mb-4 md:mb-6 flex items-center justify-center text-lg md:text-xl font-black text-white shadow-lg shadow-red-900/30 group-hover:scale-110 transition-transform ${bank.archived ? 'grayscale opacity-50' : ''}`}>
                {bank.name.charAt(0)}
              </div>
              <h3 className={`text-lg md:text-xl font-black text-white ${bank.archived ? 'opacity-50' : ''}`}>{bank.name}</h3>
              
              <div className="grid grid-cols-3 gap-1 md:gap-2 mt-4 md:mt-6">
                <div>
                  <p className="text-[7px] md:text-[8px] text-slate-500 font-bold uppercase tracking-widest">Inicial</p>
                  <p className="text-[11px] md:text-sm font-black text-white truncate">{stats.initial.toLocaleString()}€</p>
                </div>
                <div>
                  <p className="text-[7px] md:text-[8px] text-slate-500 font-bold uppercase tracking-widest">Profit</p>
                  <p className={`text-[11px] md:text-sm font-black truncate ${stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()}€
                  </p>
                </div>
                <div>
                  <p className="text-[7px] md:text-[8px] text-slate-500 font-bold uppercase tracking-widest">Yield</p>
                  <p className={`text-[11px] md:text-sm font-black truncate ${stats.yield >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.yield.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Capital Actual</p>
                <p className="text-2xl md:text-3xl font-black text-white mt-1">{stats.current.toLocaleString()}€</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Añadir */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] p-10 rounded-[2.5rem] w-full max-w-md border border-white/10">
            <h3 className="text-xl font-black text-white mb-6 uppercase">Nuevo Tipster / Bank</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a]" placeholder="Ej: Estrategia Tenis" value={newBank.name} onChange={e => setNewBank({...newBank, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Capital Inicial</label>
                <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a]" type="number" placeholder="1000" value={newBank.initialCapital} onChange={e => setNewBank({...newBank, initialCapital: parseFloat(e.target.value)})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-xs font-black text-slate-500">CANCELAR</button>
                <button onClick={handleAdd} className="flex-1 py-4 bg-[#e2001a] rounded-2xl text-xs font-black text-white">CREAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] p-10 rounded-[2.5rem] w-full max-w-md border border-white/10">
            <h3 className="text-xl font-black text-white mb-6 uppercase">Editar Bankroll</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</label>
                <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a]" value={editingBank.name} onChange={e => setEditingBank({...editingBank, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Capital Inicial</label>
                <input className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a]" type="number" value={editingBank.initialCapital} onChange={e => setEditingBank({...editingBank, initialCapital: parseFloat(e.target.value)})} />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingBank(null)} className="flex-1 py-4 text-xs font-black text-slate-500">CANCELAR</button>
                <button onClick={handleEditSave} className="flex-1 py-4 bg-[#e2001a] rounded-2xl text-xs font-black text-white">GUARDAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Confirmar Eliminación */}
      {bankToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212] p-10 rounded-[2.5rem] w-full max-w-md border border-white/10 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <i className="fas fa-exclamation-triangle text-2xl text-[#e2001a]"></i>
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase">¿Eliminar Bankroll?</h3>
            <p className="text-slate-500 text-sm font-bold mb-8">
              ¿Estás seguro de que deseas eliminar este bankroll? Esta acción no se puede deshacer y perderás el seguimiento de este capital.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setBankToDelete(null)} className="flex-1 py-4 text-xs font-black text-slate-500">CANCELAR</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-[#e2001a] rounded-2xl text-xs font-black text-white shadow-lg shadow-red-900/20">ELIMINAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankrollManager;
