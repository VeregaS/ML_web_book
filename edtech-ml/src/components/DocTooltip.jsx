import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocTooltip({ term, definition, example }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help border-b-2 border-dotted border-blue-400 text-blue-700 font-medium hover:text-blue-900 transition-colors">
        {term}
      </span>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-5 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 text-left pointer-events-none"
          >
            <h4 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-wider">
              {term}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              {definition}
            </p>
            {example && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Пример</p>
                <code className="text-xs font-mono text-red-600 break-all">
                  {example}
                </code>
              </div>
            )}
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white drop-shadow-sm"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
