import { motion, AnimatePresence } from 'framer-motion';
import { useProgress } from '../context/ProgressContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useProgress();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border min-w-[240px]
              ${toast.type === 'success' ? 'bg-white border-green-100' : 'bg-white border-blue-100'}
            `}
          >
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center text-xl
              ${toast.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
            `}>
              {toast.type === 'success' ? '✨' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
