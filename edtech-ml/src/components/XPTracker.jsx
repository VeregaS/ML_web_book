import { useProgress } from '../context/ProgressContext';
import { motion } from 'framer-motion';

export default function XPTracker() {
  const { xp } = useProgress();

  return (
    <div className="flex items-center gap-2 font-sans pr-6 h-8 min-w-[80px]">
      {/* XP Balance */}
      <div className="flex items-center gap-2 group cursor-default" title="Ваш опыт">
        <svg className="w-3.5 h-3.5 text-indigo-600 fill-current" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div className="flex items-baseline gap-1 min-w-[40px]">
          <motion.span 
            key={xp}
            className="text-sm font-bold tabular-nums text-indigo-600"
          >
            {xp}
          </motion.span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter transition-colors">XP</span>
        </div>
      </div>
    </div>
  );
}
