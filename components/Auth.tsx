
import React, { useState } from 'react';
import { supabase, supabaseConfigured, authErrorMessage } from '../src/lib/supabase';
import { LineChart, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthProps {
  /** 'reset' = se ha abierto el enlace de recuperación: pedir la contraseña nueva */
  mode?: 'login' | 'reset';
  onResetDone?: () => void;
}

type View = 'login' | 'register' | 'recover' | 'reset';

const inputClass = 'w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a] transition-all';

const Auth: React.FC<AuthProps> = ({ mode = 'login', onResetDone }) => {
  const [view, setView] = useState<View>(mode === 'reset' ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegistering = view === 'register';
  const isRecovering = view === 'recover';
  const isResetting = view === 'reset';
  const go = (v: View) => { setView(v); setError(''); setSuccess(''); };

  // La sesión la recoge App con onAuthStateChange: aquí solo se llama a Supabase
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!supabaseConfigured) {
      setError('Esta versión de la web no está configurada (faltan las claves de Supabase). Abre la dirección principal de la app.');
      return;
    }
    const mail = email.trim();

    if (isResetting) {
      if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
      setLoading(true);
      const { error: err } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (err) { setError(authErrorMessage(err)); return; }
      onResetDone?.();
      return;
    }

    if (isRecovering) {
      if (!mail) { setError('Por favor, introduce tu email.'); return; }
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: window.location.origin });
      setLoading(false);
      if (err) { setError(authErrorMessage(err)); return; }
      setSuccess('Si el email tiene cuenta, te llegará un enlace para crear una contraseña nueva.');
      return;
    }

    if (!mail || !password || (isRegistering && !name.trim())) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);
    if (isRegistering) {
      const { data, error: err } = await supabase.auth.signUp({
        email: mail,
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (err) { setError(authErrorMessage(err)); return; }
      // Si Supabase pide confirmar el email, todavía no hay sesión
      if (!data.session) {
        setView('login');
        setPassword('');
        setSuccess('Cuenta creada. Te hemos enviado un email: confírmalo y vuelve para entrar.');
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: mail, password });
      setLoading(false);
      if (err) setError(authErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#e2001a]/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#ffcc00]/5 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#e2001a] rounded-[2rem] shadow-2xl shadow-red-900/40 mb-6 rotate-12">
            <LineChart className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 italic">BETTRACK <span className="text-[#ffcc00]">PRO</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Audit Intelligence System</p>
        </div>

        <div className="glass-panel rounded-[3rem] p-8 md:p-10 border-white/5 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-8 uppercase italic tracking-tight">
            {isResetting ? 'Nueva Contraseña' : isRecovering ? 'Recuperar Contraseña' : (isRegistering ? 'Crear Nueva Cuenta' : 'Acceso Restringido')}
          </h2>

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <input type="text" autoComplete="name" className={inputClass} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            {!isResetting && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <input type="email" autoComplete="email" className={inputClass} placeholder="email@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}

            {!isRecovering && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isResetting ? 'Contraseña nueva' : 'Contraseña'}</label>
                  {view === 'login' && (
                    <button type="button" onClick={() => go('recover')} className="text-[9px] font-black text-[#e2001a] uppercase tracking-widest hover:underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  className={inputClass}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {error && (
              <p className="text-[#e2001a] text-[10px] font-black uppercase text-center bg-red-500/10 py-3 px-3 rounded-xl border border-red-500/20 flex items-center justify-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />{error}
              </p>
            )}

            {success && (
              <p className="text-emerald-500 text-[10px] font-black uppercase text-center bg-emerald-500/10 py-3 px-3 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />{success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-[#e2001a] to-[#920011] rounded-2xl text-xs font-black text-white shadow-2xl shadow-red-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 transition-all uppercase tracking-[0.2em] mt-4"
            >
              {loading
                ? <Loader2 size={16} className="animate-spin mx-auto" />
                : isResetting ? 'Guardar Contraseña' : isRecovering ? 'Enviar Enlace' : (isRegistering ? 'Registrarme Ahora' : 'Entrar en el Sistema')}
            </button>
          </form>

          {!isResetting && (
            <div className="mt-8 pt-8 border-t border-white/5 text-center space-y-4">
              {isRecovering ? (
                <button onClick={() => go('login')} className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">
                  Volver al Acceso
                </button>
              ) : (
                <button onClick={() => go(isRegistering ? 'login' : 'register')} className="text-slate-500 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all">
                  {isRegistering ? '¿Ya tienes cuenta? Acceder' : '¿Eres nuevo? Crear Cuenta'}
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-zinc-700 text-[9px] font-bold mt-8 uppercase tracking-[0.2em]">
          &copy; 2026 BetTrack Pro • Cuentas protegidas con Supabase
        </p>
      </div>
    </div>
  );
};

export default Auth;
