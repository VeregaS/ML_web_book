import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from './MarkdownBlock';

export default function DocTooltip({ term, originalTerm, definition, example, isGlossaryMode = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, maxHeight: 400, side: 'top' });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  // ГЛОССАРИЙ: скролл к определению
  if (isGlossaryMode) {
    const handleScrollToTerm = (e) => {
      e.preventDefault();
      const targetId = `glossary-${(originalTerm || term).toLowerCase()}`;
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-[var(--accent-primary)]/50');
        setTimeout(() => element.classList.remove('ring-4', 'ring-[var(--accent-primary)]/50'), 2000);
      }
    };

    return (
      <button 
        onClick={handleScrollToTerm}
        className="font-bold text-[var(--accent-primary)] underline decoration-[var(--accent-primary)]/30 hover:decoration-[var(--accent-primary)] decoration-2 underline-offset-4 transition-all"
      >
        {term}
      </button>
    );
  }

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const margin = 20;
      
      // Вычисляем доступное место сверху и снизу
      const spaceAbove = rect.top - margin;
      const spaceBelow = viewportHeight - rect.bottom - margin;
      
      // Решаем, в какую сторону открывать
      const shouldFlip = spaceAbove < 350 && spaceBelow > spaceAbove;
      
      const maxHeight = shouldFlip ? spaceBelow - 40 : spaceAbove - 40;

      setCoords({
        top: shouldFlip ? rect.bottom : rect.top,
        left: rect.left + rect.width / 2,
        side: shouldFlip ? 'bottom' : 'top',
        maxHeight: Math.max(maxHeight, 200) // Минимум 200px высоты
      });
    }
  }, []);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updatePosition();
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) && 
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setIsVisible(false);
      }
    };

    const handleUpdate = () => updatePosition();

    document.addEventListener('mousedown', handleClickOutside);
    // Используем capture: true для скролла, но не закрываем окно
    window.addEventListener('scroll', handleUpdate, { capture: true, passive: true });
    window.addEventListener('resize', handleUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, updatePosition]);

  const isTop = coords.side === 'top';

  return (
    <>
      <button 
        ref={triggerRef}
        onClick={toggle}
        className="cursor-help font-semibold text-[var(--text-bright)] border-b border-dotted border-[var(--accent-primary)]/60 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all px-0.5 rounded-sm select-none inline"
      >
        {term}
      </button>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <div 
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: coords.top,
                left: coords.left,
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
                // Важно: поглощаем все события мыши, чтобы скролл не "протекал" на родителя
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
              >
                <div 
                  className="w-80 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl overflow-hidden shadow-2xl transition-colors duration-300 flex flex-col"
                  style={{ maxHeight: coords.maxHeight }}
                >
                  <div className="bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-3.5 bg-[var(--accent-primary)] rounded-full"></div>
                      <h4 className="text-[13px] font-bold text-[var(--text-bright)] uppercase tracking-widest truncate max-w-[180px]">{term}</h4>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVisible(false);
                      }}
                      className="p-1 hover:bg-[var(--border-main)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-bright)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain bg-[var(--bg-card)]">
                    <div className="p-5 space-y-4">
                      <div className="text-[13px] leading-relaxed text-[var(--text-main)]">
                        <MarkdownBlock content={definition} excludeTerm={originalTerm || term} />
                      </div>
                      {example && (
                        <div className="bg-[var(--bg-subpanel)] p-3 rounded-lg border border-[var(--border-light)] text-[12px] italic text-[var(--text-main)] opacity-90 transition-colors duration-300">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Пример / Аналогия</div>
                          <MarkdownBlock content={example} excludeTerm={originalTerm || term} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Arrow Pointer */}
                <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--bg-card)] rotate-45 transition-colors duration-300 shadow-sm border-[var(--border-main)] 
                  ${isTop ? 'top-full -mt-[1px] border-r border-b' : 'bottom-full -mb-[1px] border-l border-t'}`}>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
