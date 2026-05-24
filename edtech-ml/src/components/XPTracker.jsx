import { useProgress } from '../context/ProgressContext';
import { motion } from 'framer-motion';

export default function XPTracker() {
  const { xp } = useProgress();

  return (
    <div className="flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-main)] px-3 py-1.5 rounded-full shadow-sm min-w-[70px] h-9 transition-colors">
      <div className="flex items-center gap-1.5 group cursor-default" title="Ваш опыт">
        <svg className="w-3.5 h-3.5 text-[var(--accent-primary)] fill-current" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div className="flex items-baseline gap-1">
          <motion.span 
            key={xp}
            className="text-[13px] font-black tabular-nums text-[var(--text-bright)] leading-none"
          >
            {xp}
          </motion.span>
          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">XP</span>
        </div>
      </div>
    </div>
  );
}
