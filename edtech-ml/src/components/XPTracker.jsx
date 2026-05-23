import { useProgress } from '../context/ProgressContext';
import { motion } from 'framer-motion';

export default function XPTracker() {
  const { xp, streak } = useProgress();

  return (
    <div className="flex items-center gap-4 text-slate-700 font-sans border-r border-slate-200 pr-6 h-8">
      {/* Streak */}
      <div className="flex items-center gap-2 group cursor-default" title="Ударный режим">
        <svg className="w-4 h-4 text-orange-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 2c-.5 0-1 .2-1.3.6L5.4 10.3c-.6.8-.7 1.8-.3 2.7.4.9 1.3 1.5 2.2 1.5h1.2l-1.5 6.2c-.2.7.1 1.4.7 1.9.6.5 1.5.5 2.1 0l7.3-7.7c.6-.8.7-1.8.3-2.7-.4-.9-1.3-1.5-2.2-1.5h-1.2l1.5-6.2c.2-.7-.1-1.4-.7-1.9-.3-.3-.6-.3-.9-.3z" />
        </svg>
        <span className="text-sm font-bold tabular-nums">{streak}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-2 group cursor-default" title="Накопленный опыт">
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <motion.span 
          key={xp}
          initial={{ color: '#6366f1', scale: 1.1 }}
          animate={{ color: '#334155', scale: 1 }}
          className="text-sm font-bold tabular-nums"
        >
          {xp}
        </motion.span>
      </div>
    </div>
  );
}
