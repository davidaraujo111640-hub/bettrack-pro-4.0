
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import AnimatedLogo from './components/AnimatedLogo';
import UpdatePrompt from './components/UpdatePrompt';
import UserBadge from './components/UserBadge';
import { Bet, BetStatus, BankrollStats, Bankroll, User, Bookmaker } from './types';
import { defaultBookmakers, normalizeBookmakers } from './src/utils/defaultBookmakers';
import { calculateProfit, calculateRoi, calculateYield, realStake } from './src/utils/betMath';
import { BackupData, downloadBackup, parseBackup } from './src/utils/backup';
import { supabase, toAppUser } from './src/lib/supabase';
import { useCloudSync } from './src/lib/useCloudSync';
import { takeSharedImage } from './src/utils/sharedImage';
import type { CloudData } from './src/lib/cloudSync';

const DEFAULT_BANKROLL: Bankroll = { id: 'default', name: 'Bankroll Principal', initialCapital: 1000, color: '#e2001a' };

const LOCAL_BACKUP_KEY = 'bt_local_backup';

/** Lee la copia local de seguridad (la guarda useCloudSync) si existe y es válida */
function readLocalBackup(): BackupData | null {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    const parsed = parseBackup(raw);
    return parsed.ok && parsed.data.bets.length > 0 ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Datos de una cuenta nueva */
const emptyData = (): CloudData => ({ bets: [], bankrolls: [DEFAULT_BANKROLL], bookmakers: defaultBookmakers() });
import { 
  Home, 
  ListCheck, 
  PieChart, 
  Wallet, 
  Zap, 
  Landmark, 
  Globe, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  PlusCircle, 
  Plus,
  RefreshCw,
  CloudOff,
  LineChart
} from 'lucide-react';

const App: React.FC = () => {
  // Sesión real de Supabase. authReady evita enseñar el login un instante mientras se lee la sesión guardada
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Se ha abierto el enlace de "recuperar contraseña" del email: pedir la nueva
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const [bankrolls, setBankrolls] = useState<Bankroll[]>(() => {
    try {
      const saved = localStorage.getItem('bt_bankrolls');
      return saved ? JSON.parse(saved) : [DEFAULT_BANKROLL];
    } catch (e) {
      console.error("Error parsing bankrolls", e);
      return [DEFAULT_BANKROLL];
    }
  });

  const [bookmakers, setBookmakers] = useState<Bookmaker[]>(() => {
    try {
      const saved = localStorage.getItem('bt_bookmakers');
      if (saved) return normalizeBookmakers(JSON.parse(saved));
    } catch (e) {
      console.error("Error parsing bookmakers", e);
    }
    return defaultBookmakers();
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
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);
  // Imagen compartida desde otra app (menú Compartir de Android) pendiente de analizar
  const [sharedImage, setSharedImage] = useState<File | null>(null);
  // Apuesta recién guardada: la lista la resalta un momento con el destello
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const justSavedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashSaved = useCallback((id: string) => {
    setJustSavedId(id);
    clearTimeout(justSavedTimer.current);
    justSavedTimer.current = setTimeout(() => setJustSavedId(null), 2000);
  }, []);

  const updateLastSaved = useCallback(() => setLastSaved(new Date().toLocaleTimeString()), []);


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

  useEffect(() => {
    // Restos del login antiguo (solo local), ya no se usan
    localStorage.removeItem('bt_session');
    localStorage.removeItem('bt_users');

    // Para dar la bienvenida solo al entrar de verdad (Supabase también avisa al recuperar la sesión)
    let hadUser: boolean | null = null;
    supabase.auth.getSession().then(({ data }) => {
      hadUser = !!data.session;
      setUser(data.session ? toAppUser(data.session.user) : null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      if (event === 'SIGNED_IN' && session && hadUser === false) showToast(`Bienvenido, ${toAppUser(session.user).name}`);
      if (event !== 'INITIAL_SESSION') hadUser = !!session;
      setUser(session ? toAppUser(session.user) : null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, [showToast]);

  // Datos en la nube: carga al entrar, sube cada cambio y recibe los de otros dispositivos
  const cloudData = useMemo<CloudData>(() => ({ bets, bankrolls, bookmakers }), [bets, bankrolls, bookmakers]);
  const cloud = useCloudSync({
    userId: user?.id ?? null,
    data: cloudData,
    setBets,
    setBankrolls,
    setBookmakers,
    normalizeBookmakers,
    emptyData,
  });

  // La imagen compartida solo vale para la ventana que se abrió con ella
  useEffect(() => {
    if (!isAddModalOpen) setSharedImage(null);
  }, [isAddModalOpen]);

  // Compartir desde otra app: el service worker deja la imagen en una caché; en cuanto la sesión y los datos
  // están listos, se abre "Nueva apuesta" con ella. Si lo compartido no era una imagen, se avisa.
  useEffect(() => {
    if (cloud.status !== 'ready') return;
    const params = new URLSearchParams(window.location.search);
    const share = params.get('share');
    if (share) {
      params.delete('share');
      const query = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (query ? '?' + query : '') + window.location.hash);
    }
    if (share === 'other') showToast('Solo se pueden leer imágenes. Comparte la captura de la apuesta.', 'info');
    if (!('caches' in window)) return;
    takeSharedImage(caches).then(file => {
      if (!file) return;
      setEditingBet(null);
      setSharedImage(file);
      setIsAddModalOpen(true);
    });
  }, [cloud.status, showToast]);

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
    const totalStake = closedBets.reduce((acc, b) => acc + realStake(b), 0);
    const wonBets = closedBets.filter(b => b.status === BetStatus.WON || (b.status === BetStatus.CASH_OUT && b.profit > 0)).length;
    
    const initialCap = activeBankrollId === 'all' 
      ? bankrolls.filter(b => !b.archived).reduce((acc, b) => acc + b.initialCapital, 0)
      : (bankrolls.find(b => b.id === activeBankrollId)?.initialCapital || 0);

    return {
      totalProfit,
      roi: calculateRoi(totalProfit, initialCap),
      yield: calculateYield(totalProfit, totalStake),
      winRate: closedBets.length > 0 ? (wonBets / closedBets.length) * 100 : 0,
      totalBets: filteredBets.length,
      activeBets: filteredBets.filter(b => b.status === BetStatus.PENDING).length,
      initialBankroll: initialCap,
      currentBankroll: initialCap + totalProfit
    };
  }, [filteredBets, activeBankrollId, bankrolls]);

  const handleAddBet = useCallback((newBet: Omit<Bet, 'id' | 'profit'> & { manualProfit?: number }) => {
    const { manualProfit, ...betData } = newBet;
    const profit = calculateProfit(betData.status, betData.odds, betData.stake, manualProfit, betData.freebet);

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

    const savedId = editingBet ? editingBet.id : crypto.randomUUID();
    setBets(prevBets => {
      if (editingBet) {
        return prevBets.map(b => b.id === editingBet.id ? { ...betData, id: editingBet.id, profit } : b);
      } else {
        const betWithId: Bet = {
          ...betData,
          id: savedId,
          profit
        };
        return [betWithId, ...prevBets];
      }
    });
    flashSaved(savedId);

    if (editingBet) {
      showToast('Operación actualizada');
      setEditingBet(null);
    } else {
      showToast('Nueva apuesta registrada');
    }
    setIsAddModalOpen(false);
    updateLastSaved();
  }, [editingBet, showToast, updateLastSaved, bankrolls, flashSaved]);

  const handleUpdateStatus = useCallback((id: string, newStatus: BetStatus, manualProfit?: number) => {
    setBets(prevBets => prevBets.map(bet => {
      if (bet.id === id) {
        const profit = calculateProfit(newStatus, bet.odds, bet.stake, manualProfit, bet.freebet);
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

  const handleExportBackup = useCallback(() => {
    downloadBackup({ bets, bankrolls, bookmakers });
    showToast('Copia de seguridad descargada');
  }, [bets, bankrolls, bookmakers, showToast]);

  // Lee el archivo y, si es válido, pide confirmación antes de reemplazar los datos
  const handleImportBackupFile = useCallback(async (file: File) => {
    const result = parseBackup(await file.text());
    if (result.ok) {
      setPendingRestore(result.data);
    } else {
      showToast(result.error, 'error');
    }
  }, [showToast]);

  // Copia que la app guarda sola si, al entrar con la cuenta, había datos de antes en este dispositivo
  const [localBackup, setLocalBackup] = useState<BackupData | null>(readLocalBackup);

  const handleRestoreLocalBackup = useCallback(() => {
    if (localBackup) setPendingRestore(localBackup);
  }, [localBackup]);

  const handleDownloadLocalBackup = useCallback(() => {
    if (!localBackup) return;
    downloadBackup({ bets: localBackup.bets, bankrolls: localBackup.bankrolls, bookmakers: localBackup.bookmakers ?? [] });
  }, [localBackup]);

  const confirmRestore = useCallback(() => {
    if (!pendingRestore) return;
    if (pendingRestore === localBackup) {
      try { localStorage.removeItem(LOCAL_BACKUP_KEY); } catch { /* da igual */ }
      setLocalBackup(null);
    }
    setBets(pendingRestore.bets);
    setBankrolls(pendingRestore.bankrolls);
    if (pendingRestore.bookmakers && pendingRestore.bookmakers.length > 0) {
      setBookmakers(pendingRestore.bookmakers);
    }
    setActiveBankrollId('all');
    setPendingRestore(null);
    showToast(`Datos restaurados: ${pendingRestore.bets.length} apuestas`);
    updateLastSaved();
  }, [pendingRestore, localBackup, showToast, updateLastSaved]);

  const handleLogout = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const confirmLogout = useCallback(() => {
    supabase.auth.signOut();
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

  const handleSetActiveBankroll = useCallback((id: string) => {
    setActiveBankrollId(id);
    setBankrolls(prev => {
      const bankName = id === 'all' ? 'Global' : prev.find(b => b.id === id)?.name;
      showToast(`Cambiado a ${bankName}`, 'info');
      return prev;
    });
  }, [showToast]);

  // Las 4 casas con más apuestas registradas, para el selector de casa
  const recentBookmakers = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bets) if (b.bookmaker) counts.set(b.bookmaker, (counts.get(b.bookmaker) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([name]) => name);
  }, [bets]);

  // Los 4 deportes con más apuestas registradas, para el selector de deporte
  const recentSports = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bets) if (b.sport) counts.set(b.sport, (counts.get(b.sport) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([name]) => name);
  }, [bets]);

  const activeBankrollName = useMemo(() => {
    if (activeBankrollId === 'all') return 'Global';
    return bankrolls.find(b => b.id === activeBankrollId)?.name || 'Bankroll';
  }, [activeBankrollId, bankrolls]);

  if (!authReady) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  if (isPasswordRecovery) {
    return <Auth mode="reset" onResetDone={() => { setIsPasswordRecovery(false); showToast('Contraseña actualizada'); }} />;
  }

  if (!user) {
    return <Auth />;
  }

  if (cloud.status === 'loading' || cloud.status === 'idle') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-[#e2001a] rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-red-900/40 animate-pulse"><LineChart className="text-white w-8 h-8" /></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cargando tus datos…</p>
      </div>
    );
  }

  if (cloud.status === 'needs-online') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="glass-panel rounded-[2.5rem] p-8 max-w-sm text-center space-y-4">
          <p className="text-lg font-black text-white uppercase italic">Sin conexión</p>
          <p className="text-xs font-bold text-slate-400">La primera vez que entras en este dispositivo hace falta internet para descargar tus datos. Después ya funciona sin conexión.</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-[#e2001a] rounded-2xl text-[10px] font-black text-white uppercase tracking-widest">Reintentar</button>
        </div>
      </div>
    );
  }

  if (cloud.status === 'migrate') {
    return (
      <div className="min-h-screen bg-[#050505]">
        <ConfirmModal
          isOpen
          title="Subir tus datos a tu cuenta"
          message={`En este dispositivo tienes ${cloud.legacyCount} apuestas guardadas de antes de tener cuenta. ¿Las subimos a tu cuenta para verlas desde cualquier dispositivo? Si eliges empezar de cero se guarda una copia en este navegador.`}
          confirmText="Subir mis apuestas"
          cancelText="Empezar de cero"
          onConfirm={() => { cloud.resolveMigration(true); showToast(`${cloud.legacyCount} apuestas subidas a tu cuenta`); }}
          onCancel={() => cloud.resolveMigration(false)}
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col md:flex-row h-screen bg-transparent p-0 md:p-6 gap-0 md:gap-6 text-slate-100 overflow-hidden">
        {/* Sidebar escritorio */}
        <nav className="hidden md:flex w-72 glass-panel rounded-[2rem] p-8 flex-col gap-8 shadow-2xl border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-[#e2001a] p-3 rounded-2xl">
              <AnimatedLogo className="text-white w-5 h-5" />
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
                    <UserBadge plan={user.plan} size={20} />
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
                   <span className={`text-[8px] font-black uppercase tracking-tighter flex items-center gap-1 ${cloud.syncState === 'synced' ? 'text-emerald-500' : cloud.syncState === 'pending' ? 'text-[#ffcc00]' : 'text-slate-500'}`}>
                      {cloud.syncState === 'synced' && <><CheckCircle2 className="w-2 h-2" /> Guardado en la nube</>}
                      {cloud.syncState === 'pending' && <><RefreshCw className="w-2 h-2 animate-spin" /> Sincronizando…</>}
                      {cloud.syncState === 'offline' && <><CloudOff className="w-2 h-2" /> Sin conexión · se subirá luego</>}
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
              <Route path="/" element={<Dashboard stats={stats} bets={filteredBets} userName={user?.name} userPlan={user?.plan} onProfileClick={() => setIsProfileModalOpen(true)} syncState={cloud.syncState} onSyncClick={() => showToast(cloud.syncState === 'synced' ? 'Guardado en la nube' : cloud.syncState === 'pending' ? 'Sincronizando…' : 'Sin conexión: los cambios se subirán al volver internet', cloud.syncState === 'offline' ? 'info' : 'success')} />} />
              <Route path="/bets" element={<BetList bets={filteredBets} allBets={bets} bookmakers={bookmakers} bankrolls={bankrolls} activeBankrollName={activeBankrollName} onDelete={handleDeleteBet} onUpdateStatus={handleUpdateStatus} onEdit={handleEdit} justSavedId={justSavedId} />} />
              <Route path="/statistics" element={<Statistics bets={filteredBets} stats={stats} bankrolls={bankrolls} activeBankrollId={activeBankrollId} onSelectBankroll={handleSetActiveBankroll} />} />
              <Route path="/bankrolls" element={<BankrollManager bankrolls={bankrolls} bets={bets} onUpdate={setBankrolls} activeBankrollId={activeBankrollId} onSelect={handleSetActiveBankroll} onExportBackup={handleExportBackup} onImportBackup={handleImportBackupFile} localBackup={localBackup ? { bets: localBackup.bets.length, bankrolls: localBackup.bankrolls.length } : null} onRestoreLocalBackup={handleRestoreLocalBackup} onDownloadLocalBackup={handleDownloadLocalBackup} />} />
              <Route path="/bookmakers" element={<BookmakerManager bookmakers={bookmakers} onUpdate={setBookmakers} />} />
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
            recentBookmakers={recentBookmakers}
            recentSports={recentSports}
            sharedImage={sharedImage}
          />
        )}

        <UpdatePrompt />

        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        <ConfirmModal
          isOpen={pendingRestore !== null}
          title="Restaurar copia de seguridad"
          message={pendingRestore ? `Se restaurarán ${describeBackup(pendingRestore)}. Esto reemplazará todos tus datos actuales y no se puede deshacer.` : ''}
          onConfirm={confirmRestore}
          onCancel={() => setPendingRestore(null)}
          confirmText="Reemplazar datos"
          type="danger"
        />

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

const plural = (n: number, singular: string, pluralForm: string) => `${n} ${n === 1 ? singular : pluralForm}`;

// "12 apuestas, 1 bankroll y 33 casas de apuestas"
const describeBackup = (data: BackupData): string => {
  const parts = [plural(data.bets.length, 'apuesta', 'apuestas'), plural(data.bankrolls.length, 'bankroll', 'bankrolls')];
  if (data.bookmakers) parts.push(plural(data.bookmakers.length, 'casa de apuestas', 'casas de apuestas'));
  return parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
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
