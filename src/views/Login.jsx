import { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const u1 = import.meta.env.VITE_USER1_NAME;
    const p1 = import.meta.env.VITE_USER1_PASS;
    const u2 = import.meta.env.VITE_USER2_NAME;
    const p2 = import.meta.env.VITE_USER2_PASS;

    if ((user === u1 && pass === p1) || (user === u2 && pass === p2)) {
      localStorage.setItem('bitacora_auth', 'true');
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-0">
      <div className="w-full max-w-sm glass-card p-8 rounded-[2rem] aero-glow border border-white/50 dark:border-[#134e63] shadow-[0_20px_50px_rgba(0,168,232,0.3)] animate-in zoom-in-95 duration-500 relative z-10 flex flex-col items-center">
        
        <div className="bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white p-4 rounded-full aero-glow mb-6">
          <Sparkles size={32} />
        </div>
        
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-blue-600 mb-2">
          Bitácora de Visitas
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center font-medium">
          Acceso privado al diario
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Usuario"
            value={user}
            onChange={e => setUser(e.target.value)}
            className="w-full bg-white/70 dark:bg-[#061e26]/70 border border-gray-200 dark:border-[#134e63] rounded-2xl p-4 text-[#0b3b4d] dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all shadow-inner"
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="w-full bg-white/70 dark:bg-[#061e26]/70 border border-gray-200 dark:border-[#134e63] rounded-2xl p-4 text-[#0b3b4d] dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all shadow-inner"
            required
          />
          
          {error && <span className="text-red-500 text-xs text-center font-bold">Credenciales incorrectas</span>}

          <button 
            type="submit"
            className="w-full btn-glossy flex items-center justify-center gap-2 text-white font-bold text-lg py-4 rounded-2xl mt-4 aero-glow transition-transform active:scale-95"
          >
            Entrar <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
