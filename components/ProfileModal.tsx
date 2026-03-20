
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdate,
  showToast
}) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // Sync name state when user prop changes
  React.useEffect(() => {
    setName(user.name);
  }, [user.name]);

  if (!isOpen) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('bt_users') || '[]');
      const userIdx = users.findIndex((u: User & { password?: string }) => u.email.toLowerCase() === user.email.toLowerCase());

      if (userIdx !== -1) {
        users[userIdx].name = name.trim();
        localStorage.setItem('bt_users', JSON.stringify(users));
        
        // Update session as well
        const updatedUser = { ...user, name: name.trim() };
        onUpdate(updatedUser);
        showToast('¡Nombre de perfil actualizado con éxito!', 'success');
      } else {
        setError('No se pudo encontrar el usuario en la base de datos.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Error al guardar los cambios.');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('bt_users') || '[]');
    const userIdx = users.findIndex((u: User & { password?: string }) => u.email.toLowerCase() === user.email.toLowerCase());

    if (userIdx === -1) {
      setError('Usuario no encontrado.');
      return;
    }

    if (users[userIdx].password !== currentPassword) {
      setError('La contraseña actual es incorrecta.');
      return;
    }

    users[userIdx].password = newPassword;
    localStorage.setItem('bt_users', JSON.stringify(users));
    
    showToast('Contraseña actualizada correctamente', 'success');
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md glass-panel rounded-[3rem] p-8 md:p-10 border-white/10 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-[200px] h-[200px] bg-[#e2001a]/10 blur-[60px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-[#ffcc00]/5 blur-[60px] rounded-full"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Mi Perfil</h2>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="space-y-8">
            {/* User Info Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 p-6 bg-white/5 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e2001a] to-[#920011] flex items-center justify-center text-white text-2xl shadow-2xl shadow-red-900/40">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-xs font-bold text-white truncate">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#e2001a] transition-all" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  user.plan === 'PRO' ? 'bg-[#ffcc00] text-black' : 'bg-slate-700 text-white'
                }`}>
                  {user.plan} MEMBER
                </span>
              </div>
            </form>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Seguridad</h4>
              </div>

              {!isChangingPassword ? (
                <button 
                  onClick={() => { setIsChangingPassword(true); setError(''); }}
                  className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-slate-400 group-hover:text-[#e2001a] transition-all">
                      <i className="fas fa-key"></i>
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Cambiar Contraseña</span>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-slate-600 group-hover:text-white transition-all"></i>
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña Actual</label>
                    <input 
                      type="password"
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a] transition-all" 
                      placeholder="••••••••" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                    <input 
                      type="password"
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a] transition-all" 
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                    <input 
                      type="password"
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-[#e2001a] transition-all" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-[#e2001a] text-[10px] font-black uppercase text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                      <i className="fas fa-exclamation-triangle mr-2"></i>{error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button 
                      type="submit" 
                      className="flex-1 py-4 bg-[#e2001a] rounded-2xl text-[10px] font-black text-white hover:bg-red-500 transition-all uppercase tracking-widest"
                    >
                      Actualizar
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsChangingPassword(false); setError(''); }}
                      className="flex-1 py-4 bg-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between px-2 mb-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Suscripción</h4>
              </div>
              <div className="p-6 bg-zinc-900 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white mb-1">Plan Actual: {user.plan}</p>
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">Acceso total a todas las herramientas de auditoría.</p>
                </div>
                {user.plan === 'FREE' && (
                  <button className="px-4 py-2 bg-[#ffcc00] text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-all">
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
