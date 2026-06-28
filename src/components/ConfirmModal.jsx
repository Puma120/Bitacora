import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-card p-6 rounded-3xl aero-glow border border-white/50 dark:border-[#134e63] shadow-[0_20px_50px_rgba(0,168,232,0.4)] animate-in zoom-in-95 duration-300 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="bg-red-500/20 text-red-500 p-4 rounded-full mb-4 aero-glow">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-[#0b3b4d] dark:text-white mb-2">
            {title}
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          <div className="flex w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-colors"
            >
              Sí, borrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
