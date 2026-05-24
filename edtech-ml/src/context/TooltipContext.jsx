import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TooltipContext = createContext();

export function TooltipProvider({ children }) {
  const [tooltips, setTooltips] = useState([]); 

  const openTooltip = useCallback((id, triggerRef, contentData) => {
    setTooltips(prev => {
      if (prev.some(t => t.id === id)) return prev;
      return [...prev, { id, triggerRef, ...contentData }];
    });
  }, []);

  const closeTooltip = useCallback((id) => {
    setTooltips(prev => prev.filter(t => t.id !== id));
  }, []);

  const closeAll = useCallback(() => setTooltips([]), []);

  return (
    <TooltipContext.Provider value={{ tooltips, openTooltip, closeTooltip, closeAll }}>
      {children}
      <TooltipPortal tooltips={tooltips} closeTooltip={closeTooltip} />
    </TooltipContext.Provider>
  );
}

function TooltipPortal({ tooltips, closeTooltip }) {
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence mode="popLayout">
        {tooltips.map((t) => (
          <TooltipItem 
            key={t.id} 
            data={t} 
            onClose={() => closeTooltip(t.id)} 
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function TooltipItem({ data, onClose }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [side, setSide] = useState('top'); // 'top' or 'bottom'
  const tooltipRef = useRef(null);

  const updatePos = useCallback(() => {
    if (data.triggerRef && data.triggerRef.current) {
      const rect = data.triggerRef.current.getBoundingClientRect();
      
      // Если до верха экрана меньше 320px — перекидываем вниз
      const shouldFlip = rect.top < 320;
      setSide(shouldFlip ? 'bottom' : 'top');

      setPos({
        top: rect.top,
        bottom: rect.bottom, // Для позиционирования снизу
        left: rect.left + rect.width / 2,
        height: rect.height
      });
    }
  }, [data.triggerRef]);

  useEffect(() => {
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    const interval = setInterval(updatePos, 100);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      clearInterval(interval);
    };
  }, [updatePos]);

  const isTop = side === 'top';

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: isTop ? pos.top : pos.bottom,
        left: pos.left,
        // Смещение в зависимости от стороны
        transform: `translate(-50%, ${isTop ? 'calc(-100% - 14px)' : '14px'})`,
      }}
    >
      <motion.div
        ref={tooltipRef}
        initial={{ opacity: 0, y: isTop ? 10 : -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: isTop ? 5 : -5, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative pointer-events-auto shadow-2xl"
      >
        <div className="w-80 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl overflow-hidden shadow-2xl transition-colors duration-300">
          <div className="bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-[var(--accent-primary)] rounded-full"></div>
              <h4 className="text-[13px] font-bold text-[var(--text-bright)] uppercase tracking-widest">{data.term}</h4>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[var(--border-main)] rounded-md transition-colors text-[var(--text-muted)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="p-5 max-h-60 overflow-y-auto custom-scrollbar bg-[var(--bg-card)]">
             {data.content}
          </div>
        </div>
        
        {/* Указатель-треугольник: меняет положение в зависимости от стороны */}
        <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--bg-card)] rotate-45 transition-colors duration-300 shadow-sm border-[var(--border-main)] 
          ${isTop ? 'top-full -mt-[1px] border-r border-b' : 'bottom-full -mb-[1px] border-l border-t'}`}>
        </div>
      </motion.div>
    </div>
  );
}

export const useTooltips = () => useContext(TooltipContext);
