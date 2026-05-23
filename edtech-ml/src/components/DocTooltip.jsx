import { useState, useRef, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from './MarkdownBlock';
import 'katex/dist/katex.min.css';

// Контекст для управления глубиной и иерархией окон
const TooltipContext = createContext({ depth: 0 });

/**
 * DocTooltip: Открывается по клику.
 * Поддерживает два режима: прокрутка к определению (isGlossaryMode) или всплывающее окно.
 */
export default function DocTooltip({ term, definition, example, isGlossaryMode = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, centerX: 0, safeX: 0, maxHeight: 400 });
  const [showBelow, setShowBelow] = useState(false);
  
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const { depth } = useContext(TooltipContext);

  const updatePosition = useCallback((e) => {
    if (e && e.type === 'scroll') {
      const isInsideAnyTooltip = e.target.closest && e.target.closest('[data-tooltip-depth]');
      if (isInsideAnyTooltip) return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = Math.min(450, viewportWidth - 32); 
      
      const spaceAbove = rect.top - 20;
      const spaceBelow = viewportHeight - rect.bottom - 20;
      
      const shouldShowBelow = spaceBelow > spaceAbove || rect.top < 300;
      setShowBelow(shouldShowBelow);

      const maxHeight = shouldShowBelow ? spaceBelow - 20 : spaceAbove - 20;

      const centerX = rect.left + rect.width / 2;
      let safeX = centerX;
      const halfWidth = tooltipWidth / 2;
      
      if (centerX - halfWidth < 16) {
        safeX = halfWidth + 16;
      } else if (centerX + halfWidth > viewportWidth - 16) {
        safeX = viewportWidth - halfWidth - 16;
      }

      setCoords({
        top: rect.top,
        bottom: rect.bottom,
        centerX,
        safeX,
        maxHeight: Math.max(200, maxHeight),
      });
    }
  }, []);

  const toggleTooltip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isGlossaryMode) {
      // РЕЖИМ ГЛОССАРИЯ: скролл к карточке
      const element = document.getElementById(`glossary-${term.toLowerCase()}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Добавляем кратковременную подсветку
        element.classList.add('ring-4', 'ring-indigo-500/30', 'border-indigo-300');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-indigo-500/30', 'border-indigo-300');
        }, 2000);
      }
      return;
    }

    // РЕЖИМ УРОКОВ: открытие подсказки
    if (!isVisible) {
      updatePosition();
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      const target = e.target;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (contentRef.current && contentRef.current.contains(target)) return;

      const tooltipContainer = target.closest('[data-tooltip-depth]');
      if (tooltipContainer) {
        const targetDepth = parseInt(tooltipContainer.getAttribute('data-tooltip-depth'), 10);
        if (targetDepth >= depth) return;
      }

      setIsVisible(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, updatePosition, depth]);

  const providerValue = useMemo(() => ({
    depth: depth + 1
  }), [depth]);

  return (
    <>
      <span 
        ref={triggerRef}
        className="inline cursor-pointer group relative"
        onClick={toggleTooltip}
      >
        <span className="border-b-2 border-indigo-100 group-hover:border-indigo-500 text-slate-900 font-semibold transition-all duration-200">
          {term}
        </span>
      </span>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={contentRef}
              data-tooltip-depth={depth}
              initial={{ opacity: 0, y: showBelow ? -10 : 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              style={{ 
                position: 'fixed',
                zIndex: 999999 + depth * 10,
                top: showBelow ? coords.bottom + 14 : 'auto',
                bottom: showBelow ? 'auto' : (window.innerHeight - coords.top) + 14,
                left: coords.safeX,
                transform: 'translateX(-50%)',
                pointerEvents: 'auto',
              }}
            >
              {/* Стрелочка */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent ${showBelow ? 'border-b-[10px] border-b-white -top-[10px]' : 'border-t-[10px] border-t-white -bottom-[10px]'}`}
                style={{ 
                  left: `calc(50% + ${coords.centerX - coords.safeX}px)`,
                }}
              />

              <div 
                style={{ maxHeight: coords.maxHeight }}
                className={`relative w-[calc(100vw-32px)] max-w-[450px] p-6 bg-white rounded-3xl shadow-[0_40px_80px_-15px_rgba(15,23,42,0.3)] border border-slate-100 text-left overflow-y-auto custom-scrollbar`}
                onClick={(e) => e.stopPropagation()}
              >
                <TooltipContext.Provider value={providerValue}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                        Справочник
                      </h4>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
                      className="p-1 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-500 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2.5 leading-tight">{term}</h3>
                  
                  <div className="text-[14px] text-slate-600 leading-relaxed mb-5 custom-glossary-content">
                    <MarkdownBlock content={definition} excludeTerm={term} isGlossaryMode={isGlossaryMode} />
                  </div>

                  {example && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-400 uppercase mb-2.5 block tracking-wider">Пример / Аналогия</span>
                      <div className="text-[14px] text-slate-700 italic leading-relaxed custom-glossary-content">
                        <MarkdownBlock content={example} excludeTerm={term} isGlossaryMode={isGlossaryMode} />
                      </div>
                    </div>
                  )}
                </TooltipContext.Provider>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
