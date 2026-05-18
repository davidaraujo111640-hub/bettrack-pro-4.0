
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BetList from './components/BetList';
import Statistics from './components/Statistics';
import AddBetModal from './components/AddBetModal';
import BankrollManager from './components/BankrollManager';
import BookmakerManager from './components/BookmakerManager';
import Auth from './components/Auth';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import ProfileModal from './components/ProfileModal';
import { Bet, BetStatus, BankrollStats, Bankroll, User, Bookmaker } from './types';
import { getBookmakerIcon } from './src/utils/bookmakers';
import { 
  Home, 
  ListCheck, 
  PieChart, 
  Wallet, 
  Zap, 
  Landmark, 
  Globe, 
  ShieldCheck, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  PlusCircle, 
  Plus, 
  TrendingUp
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('bt_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user session", e);
      return null;
    }
  });

  const [bankrolls, setBankrolls] = useState<Bankroll[]>(() => {
    try {
      const saved = localStorage.getItem('bt_bankrolls');
      return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Bankroll Principal', initialCapital: 1000, color: '#e2001a' }];
    } catch (e) {
      console.error("Error parsing bankrolls", e);
      return [{ id: 'default', name: 'Bankroll Principal', initialCapital: 1000, color: '#e2001a' }];
    }
  });

  const [bookmakers, setBookmakers] = useState<Bookmaker[]>(() => {
    const defaultBookmakers: Bookmaker[] = [
      { id: '888sport', name: '888sport', icon: getBookmakerIcon('888sport'), enabled: true },
      { id: 'admiralbet', name: 'AdmiralBet', icon: getBookmakerIcon('AdmiralBet'), enabled: true },
      { id: 'bet365', name: 'Bet365', icon: getBookmakerIcon('Bet365'), enabled: true },
      { id: 'betfair', name: 'Betfair', icon: getBookmakerIcon('Betfair'), enabled: true },
      { id: 'betsson', name: 'Betsson', icon: getBookmakerIcon('Betsson'), enabled: true },
      { id: 'betway', name: 'Betway', icon: getBookmakerIcon('Betway'), enabled: true },
      { id: 'bet777', name: 'Bet777', icon: getBookmakerIcon('Bet777'), enabled: true },
      { id: 'bwin', name: 'Bwin', icon: getBookmakerIcon('Bwin'), enabled: true },
      { id: 'casinobarcelona', name: 'Casino Barcelona', icon: getBookmakerIcon('Casino Barcelona'), enabled: true },
      { id: 'casinogranmadrid', name: 'Casino Gran Madrid', icon: getBookmakerIcon('Casino Gran Madrid'), enabled: true },
      { id: 'codere', name: 'Codere', icon: getBookmakerIcon('Codere'), enabled: true },
      { id: 'ebingo', name: 'Ebingo', icon: getBookmakerIcon('Ebingo'), enabled: true },
      { id: 'efbet', name: 'Efbet', icon: getBookmakerIcon('Efbet'), enabled: true },
      { id: 'enracha', name: 'Enracha', icon: getBookmakerIcon('Enracha'), enabled: true },
      { id: 'goldenpark', name: 'GoldenPark', icon: getBookmakerIcon('GoldenPark'), enabled: true },
      { id: 'interwetten', name: 'Interwetten', icon: getBookmakerIcon('Interwetten'), enabled: true },
      { id: 'jokerbet', name: 'Jokerbet', icon: getBookmakerIcon('Jokerbet'), enabled: true },
      { id: 'kirolbet', name: 'Kirolbet', icon: getBookmakerIcon('Kirolbet'), enabled: true },
      { id: 'leovegas', name: 'LeoVegas', icon: getBookmakerIcon('LeoVegas'), enabled: true },
      { id: 'luckia', name: 'Luckia', icon: getBookmakerIcon('Luckia'), enabled: true },
      { id: 'marathonbet', name: 'Marathonbet', icon: getBookmakerIcon('Marathonbet'), enabled: true },
      { id: 'marcaapuestas', name: 'Marca Apuestas', icon: getBookmakerIcon('Marca Apuestas'), enabled: true },
      { id: 'olybet', name: 'OlyBet', icon: getBookmakerIcon('OlyBet'), enabled: true },
      { id: 'paf', name: 'Paf', icon: getBookmakerIcon('Paf'), enabled: true },
      { id: 'paston', name: 'Pastón', icon: getBookmakerIcon('Pastón'), enabled: true },
      { id: 'pokerstars', name: 'PokerStars Sports', icon: getBookmakerIcon('PokerStars Sports'), enabled: true },
      { id: 'retabet', name: 'Retabet', icon: getBookmakerIcon('Retabet'), enabled: true },
      { id: 'sportium', name: 'Sportium', icon: getBookmakerIcon('Sportium'), enabled: true },
      { id: 'tonybet', name: 'TonyBet', icon: getBookmakerIcon('TonyBet'), enabled: true },
      { id: 'versus', name: 'Versus', icon: getBookmakerIcon('Versus'), enabled: true },
      { id: 'wanabet', name: 'Wanabet', icon: getBookmakerIcon('Wanabet'), enabled: true },
      { id: 'williamhill', name: 'William Hill', icon: getBookmakerIcon('William Hill'), enabled: true },
      { id: 'winamax', name: 'Winamax', icon: getBookmakerIcon('Winamax'), enabled: true },
    ].sort((a, b) => a.name.localeCompare(b.name));

    try {
      const saved = localStorage.getItem('bt_bookmakers');
      if (saved) {
        const savedList = JSON.parse(saved);
        if (!Array.isArray(savedList)) return defaultBookmakers;
        
        const savedIds = new Set(savedList.map((b: Bookmaker) => b.id));
        const savedNames = new Set(savedList.map((b: Bookmaker) => b.name?.toLowerCase()));
        
        const missing = defaultBookmakers.filter(b => 
          !savedIds.has(b.id) && !savedNames.has(b.name.toLowerCase())
        );
        
        const uniqueSaved: Bookmaker[] = [];
        const seenNames = new Set<string>();
        
        savedList.forEach((b: Bookmaker) => {
          if (b && b.name && !seenNames.has(b.name.toLowerCase())) {
            const isCustomIcon = b.icon && b.icon.startsWith('data:image');
            let updatedBookmaker = b as Bookmaker;
            
            if (!isCustomIcon) {
              const officialIcon = getBookmakerIcon(b.name);
              if (b.icon !== officialIcon) {
                updatedBookmaker = { ...b, icon: officialIcon };
              }
            }
            
            uniqueSaved.push(updatedBookmaker);
            seenNames.add(b.name.toLowerCase());
          }
        });

        return [...uniqueSaved, ...missing].sort((a, b) => a.name.localeCompare(b.name));
      }
    } catch (e) {
      console.error("Error parsing bookmakers", e);
    }
    
    return defaultBookmakers;
  });

  const [activeBankrollId, setActiveBankrollId] = useState<string>('all');
  const [bets, setBets] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem('bet_track_bets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error parsing bets", e);
      return [];
    }
  });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBankrollDropdownOpen, setIsBankrollDropdownOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const updateLastSaved = useCallback(() => setLastSaved(new Date().toLocaleTimeString()), []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bt_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('bt_session');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('bt_bankrolls', JSON.stringify(bankrolls));
  }, [bankrolls]);

  useEffect(() => {
    localStorage.setItem('bt_bookmakers', JSON.stringify(bookmakers));
  }, [bookmakers]);

  useEffect(() => {
    localStorage.setItem('bet_track_bets', JSON.stringify(bets));
  }, [bets]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const filteredBets = useMemo(() => {
    if (activeBankrollId === 'all') {
      const activeBankrollIds = new Set(bankrolls.filter(b => !b.archived).map(b => b.id));
      return bets.filter(b => activeBankrollIds.has(b.bankrollId));
    }
    return bets.filter(b => b.bankrollId === activeBankrollId);
  }, [bets, activeBankrollId, bankrolls]);

  const stats = useMemo<BankrollStats>(() => {
    const closedBets = filteredBets.filter(b => b.status !== BetStatus.PENDING);
    const totalProfit = closedBets.reduce((acc, b) => acc + b.profit, 0);
    const totalStake = closedBets.reduce((acc, b) => acc + b.stake, 0);
    const wonBets = closedBets.filter(b => b.status === BetStatus.WON || (b.status === BetStatus.CASH_OUT && b.profit > 0)).length;
    
    const initialCap = activeBankrollId === 'all' 
      ? bankrolls.filter(b => !b.archived).reduce((acc, b) => acc + b.initialCapital, 0)
      : (bankrolls.find(b => b.id === activeBankrollId)?.initialCapital || 0);

    return {
      totalProfit,
      roi: totalStake > 0 ? (totalProfit / totalStake) * 100 : 0,
      yield: totalStake > 0 ? (totalProfit / totalStake) * 100 : 0,
      winRate: closedBets.length > 0 ? (wonBets / closedBets.length) * 100 : 0,
      totalBets: filteredBets.length,
      activeBets: filteredBets.filter(b => b.status === BetStatus.PENDING).length,
      initialBankroll: initialCap,
      currentBankroll: initialCap + totalProfit
    };
  }, [filteredBets, activeBankrollId, bankrolls]);

  const handleAddBet = useCallback((newBet: Omit<Bet, 'id' | 'profit'> & { manualProfit?: number }) => {
    let profit = 0;
    if (newBet.status === BetStatus.WON) profit = (newBet.odds * newBet.stake) - newBet.stake;
    else if (newBet.status === BetStatus.LOST) profit = -newBet.stake;
    else if (newBet.status === BetStatus.CASH_OUT) profit = (newBet.manualProfit || 0) - newBet.stake;
    else if (newBet.status === BetStatus.REFUNDED || newBet.status === BetStatus.CANCELLED) profit = 0;

    // Ensure the bankroll exists
    const bankrollExists = bankrolls.some(b => b.id === newBet.bankrollId);
    if (!bankrollExists) {
      const defaultBankroll: Bankroll = {
        id: newBet.bankrollId || 'default',
        name: 'Bankroll Principal',
        initialCapital: 1000,
        color: '#e2001a',
        archived: false
      };
      setBankrolls(prev => [...prev, defaultBankroll]);
    }

    setBets(prevBets => {
      if (editingBet) {
        return prevBets.map(b => b.id === editingBet.id ? { ...newBet, id: editingBet.id, profit } : b);
      } else {
        const betWithId: Bet = {
          ...newBet,
          id: Math.random().toString(36).substr(2, 9),
          profit
        };
        return [betWithId, ...prevBets];
      }
    });

    if (editingBet) {
      showToast('Operación actualizada');
      setEditingBet(null);
    } else {
      showToast('Nueva apuesta registrada');
    }
    setIsAddModalOpen(false);
    updateLastSaved();
  }, [editingBet, showToast, updateLastSaved, bankrolls]);

  const handleUpdateStatus = useCallback((id: string, newStatus: BetStatus, manualProfit?: number) => {
    setBets(prevBets => prevBets.map(bet => {
      if (bet.id === id) {
        let profit = 0;
        if (newStatus === BetStatus.WON) profit = (bet.odds * bet.stake) - bet.stake;
        else if (newStatus === BetStatus.LOST) profit = -bet.stake;
        else if (newStatus === BetStatus.CASH_OUT) profit = (manualProfit || 0) - bet.stake;
        else if (newStatus === BetStatus.CANCELLED || newStatus === BetStatus.REFUNDED) profit = 0;
        return { ...bet, status: newStatus, profit };
      }
      return bet;
    }));

    let statusLabel: string = newStatus;
    switch(newStatus) {
      case BetStatus.WON: statusLabel = 'Ganada'; break;
      case BetStatus.LOST: statusLabel = 'Perdida'; break;
      case BetStatus.CASH_OUT: statusLabel = 'Cash Out'; break;
      case BetStatus.REFUNDED: statusLabel = 'Reembolsada'; break;
      case BetStatus.CANCELLED: statusLabel = 'Anulada'; break;
    }
    showToast(`Estado cambiado a ${statusLabel}`, 'info');
    updateLastSaved();
  }, [showToast, updateLastSaved]);

  const handleEdit = useCallback((bet: Bet) => {
    setEditingBet(bet);
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteBet = useCallback((id: string) => {
    setBets(prevBets => prevBets.filter(b => b.id !== id));
    showToast('Operación eliminada', 'error');
    updateLastSaved();
  }, [showToast, updateLastSaved]);

  const handleLogout = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setUser(null);
    setIsLogoutConfirmOpen(false);
    showToast('Sesión cerrada correctamente', 'info');
  }, [showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.bankroll-dropdown-container')) {
        setIsBankrollDropdownOpen(false);
      }
    };
    if (isBankrollDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBankrollDropdownOpen]);

  const handleLogin = useCallback((u: User) => {
    setUser(u);
    showToast(`Bienvenido, ${u.name}`);
  }, [showToast]);

  const handleSetActiveBankroll = useCallback((id: string) => {
    setActiveBankrollId(id);
    setBankrolls(prev => {
      const bankName = id === 'all' ? 'Global' : prev.find(b => b.id === id)?.name;
      showToast(`Cambiado a ${bankName}`, 'info');
      return prev;
    });
  }, [showToast]);

  const activeBankrollName = useMemo(() => {
    if (activeBankrollId === 'all') return 'Global';
    return bankrolls.find(b => b.id === activeBankrollId)?.name || 'Bankroll';
  }, [activeBankrollId, bankrolls]);

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-transparent p-0 md:p-6 gap-0 md:gap-6 text-slate-100 overflow-hidden">
        {/* Sidebar escritorio */}
        <nav className="hidden md:flex w-72 glass-panel rounded-[2rem] p-8 flex-col gap-8 shadow-2xl border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-[#e2001a] p-3 rounded-2xl">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none text-white">BETTRACK</h1>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#ffcc00] uppercase">PRO EDITION</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
             <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all group"
             >
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-[#e2001a] border border-white/5 group-hover:bg-[#e2001a] group-hover:text-white transition-all">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 text-left">
                    <p className="text-xs font-black text-white truncate">{user.name}</p>
                    <span className="text-[8px] font-black text-[#ffcc00] uppercase tracking-widest">{user.plan} MEMBER</span>
                </div>
             </button>
             <button onClick={handleLogout} className="w-full mt-3 py-2 text-[9px] font-black text-zinc-500 hover:text-[#e2001a] uppercase tracking-widest transition-all flex items-center justify-center gap-1">
                Cerrar Sesión <LogOut className="w-3 h-3" />
             </button>
          </div>

          <div className="flex flex-col gap-2">
            <NavLink to="/" icon={<Home className="w-5 h-5" />} label="Resumen" />
            <NavLink to="/bets" icon={<ListCheck className="w-5 h-5" />} label="Mis Apuestas" />
            <NavLink to="/statistics" icon={<PieChart className="w-5 h-5" />} label="Estadísticas" />
            <NavLink to="/bankrolls" icon={<Wallet className="w-5 h-5" />} label="Bankrolls" />
            <NavLink to="/bookmakers" icon={<Landmark className="w-5 h-5" />} label="Casas" />
          </div>

          <div className="mt-auto space-y-4">
            <div className="relative bankroll-dropdown-container">
              <div className="p-1.5 bg-zinc-900/50 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                <button 
                  onClick={() => setIsBankrollDropdownOpen(!isBankrollDropdownOpen)}
                  className="w-full flex items-center justify-between p-4 rounded-[1.5rem] bg-zinc-900 border border-white/5 hover:border-[#e2001a]/30 transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e2001a]/10 flex items-center justify-center text-[#e2001a] border border-[#e2001a]/20 group-hover:bg-[#e2001a] group-hover:text-white transition-all">
                      {activeBankrollId === 'all' ? <Globe className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cartera Activa</p>
                      <p className="text-sm font-black text-white truncate max-w-[120px]">
                        {activeBankrollId === 'all' ? 'Global' : bankrolls.find(b => b.id === activeBankrollId)?.name}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform duration-300 ${isBankrollDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBankrollDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-4 bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up z-50">
                    <div className="p-3 border-b border-white/5 bg-white/5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Seleccionar Bankroll</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto no-scrollbar p-2">
                      <button 
                        onClick={() => { setActiveBankrollId('all'); setIsBankrollDropdownOpen(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeBankrollId === 'all' ? 'bg-[#e2001a] text-white' : 'hover:bg-white/5 text-slate-400'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeBankrollId === 'all' ? 'bg-white/20' : 'bg-zinc-900 border border-white/5'}`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase italic tracking-tight">Global</span>
                      </button>
                      
                      {bankrolls.filter(b => !b.archived).map(b => (
                        <button 
                          key={b.id}
                          onClick={() => { setActiveBankrollId(b.id); setIsBankrollDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mt-1 ${activeBankrollId === b.id ? 'bg-[#e2001a] text-white' : 'hover:bg-white/5 text-slate-400'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeBankrollId === b.id ? 'bg-white/20' : 'bg-zinc-900 border border-white/5'}`}>
                            <span className="text-[10px] font-black">{b.name.charAt(0)}</span>
                          </div>
                          <span className="text-xs font-black uppercase italic tracking-tight truncate">{b.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 px-4 pb-2 flex items-center justify-between">
                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                      <CheckCircle2 className="w-2 h-2" /> Sincronizado
                   </span>
                   <span className="text-[8px] font-bold text-slate-600 italic">{lastSaved}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setEditingBet(null); setIsAddModalOpen(true); }}
              className="w-full font-extrabold py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all bg-[#e2001a] text-white shadow-2xl shadow-red-900/40 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Apuesta
            </button>
          </div>
        </nav>

        {/* Navegación móvil */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/10 px-2 py-3 flex items-center justify-between rounded-t-[2rem] safe-area-pb">
            <MobileNavLink to="/" icon={<Home className="w-5 h-5" />} label="Inicio" />
            <MobileNavLink to="/bets" icon={<ListCheck className="w-5 h-5" />} label="Apuestas" />
            
            <div className="relative -mt-12">
                <button 
                    onClick={() => { setEditingBet(null); setIsAddModalOpen(true); }}
                    className="w-14 h-14 rounded-full flex items-center justify-center border-4 border-[#050505] transition-all bg-[#e2001a] text-white shadow-xl shadow-red-900/40 active:scale-90"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            <MobileNavLink to="/bankrolls" icon={<Wallet className="w-5 h-5" />} label="Banks" />
            <MobileNavLink to="/statistics" icon={<PieChart className="w-5 h-5" />} label="Stats" />
        </nav>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 px-4 pt-6 md:p-0">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard stats={stats} bets={filteredBets} userName={user?.name} onProfileClick={() => setIsProfileModalOpen(true)} />} />
              <Route path="/bets" element={<BetList bets={filteredBets} activeBankrollName={activeBankrollName} onDelete={handleDeleteBet} onUpdateStatus={handleUpdateStatus} onEdit={handleEdit} />} />
              <Route path="/statistics" element={<Statistics bets={filteredBets} stats={stats} bankrolls={bankrolls} activeBankrollId={activeBankrollId} onSelectBankroll={handleSetActiveBankroll} />} />
              <Route path="/bankrolls" element={<BankrollManager bankrolls={bankrolls} bets={bets} onUpdate={setBankrolls} activeBankrollId={activeBankrollId} onSelect={handleSetActiveBankroll} />} />
              <Route path="/bookmakers" element={<BookmakerManager bookmakers={bookmakers} onUpdate={setBookmakers} />} />
              <Route path="/auth" element={<Auth onLogin={setUser} />} />
            </Routes>
          </div>
        </main>

        {isAddModalOpen && (
          <AddBetModal 
            key={editingBet?.id || 'new'}
            bankrolls={bankrolls}
            bookmakers={bookmakers}
            activeBankrollId={activeBankrollId}
            onClose={() => { setIsAddModalOpen(false); setEditingBet(null); }} 
            onSubmit={handleAddBet}
            initialData={editingBet || undefined}
          />
        )}

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        <ConfirmModal 
          isOpen={isLogoutConfirmOpen}
          title="Cerrar Sesión"
          message="¿Estás seguro de que deseas cerrar la sesión de seguridad? Deberás volver a autenticarte para acceder a tus datos."
          onConfirm={confirmLogout}
          onCancel={() => setIsLogoutConfirmOpen(false)}
          confirmText="Cerrar Sesión"
          type="danger"
        />

        {isProfileModalOpen && (
          <ProfileModal 
            isOpen={isProfileModalOpen}
            user={user}
            onClose={() => setIsProfileModalOpen(false)}
            onUpdate={setUser}
            showToast={showToast}
          />
        )}
      </div>
    </Router>
  );
};

const NavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold group ${isActive ? 'bg-[#e2001a]/10 text-[#e2001a] border border-[#e2001a]/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      <div className={`w-6 flex justify-center items-center ${isActive ? 'text-[#e2001a]' : ''}`}>
        {icon}
      </div>
      <span className="tracking-tight text-sm">{label}</span>
    </Link>
  );
};

const MobileNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-1 w-12 transition-all ${isActive ? 'text-[#e2001a]' : 'text-slate-500'}`}>
            {icon}
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
        </Link>
    );
};

export default App;
