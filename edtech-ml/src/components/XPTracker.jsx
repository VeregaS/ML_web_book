import { useProgress } from '../context/ProgressContext';
import { motion } from 'framer-motion';

export default function XPTracker() {
  const { xp, streak } = useProgress();

  return (
    <div className="flex items-center gap-4">
      {/* Streak */}
      <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold text-orange-700">{streak}</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
        <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-[10px] text-white font-black">
          XP
        </div>
        <motion.span 
          key={xp}
          initial={{ scale: 1.2, color: '#2563eb' }}
          animate={{ scale: 1, color: '#1e40af' }}
          className="text-sm font-bold tabular-nums"
        >
          {xp}
        </motion.span>
      </div>
    </div>
  );
}
