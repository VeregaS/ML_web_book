import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from './MarkdownBlock';
import { GLOBAL_GLOSSARY } from '../utils/glossary';
import 'katex/dist/katex.min.css';

const GlossaryCard = ({ term, data }) => {
  const id = `glossary-${term.toLowerCase()}`;
  
  return (
    <motion.div 
      id={id}
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 35,
        opacity: { duration: 0.15 }
      }}
      className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col target:ring-4 target:ring-[var(--accent-primary)]/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-4 bg-[var(--accent-primary)] rounded-full" />
        <h3 className="text-lg font-bold text-[var(--text-bright)]">{term}</h3>
      </div>
      
      <div className="text-[14px] text-[var(--text-main)] leading-relaxed mb-6 custom-glossary-content transition-all">
        <MarkdownBlock content={data.definition} excludeTerm={term} isGlossaryMode={true} />
      </div>

      {data.example && (
        <div className="bg-[var(--bg-subpanel)] rounded-lg p-5 border border-[var(--border-light)] mt-auto overflow-hidden transition-all">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5 block">
            Пример / Аналогия
          </span>
          <div className="text-[14px] text-[var(--text-main)] italic leading-relaxed custom-glossary-content transition-all">
            <MarkdownBlock content={data.example} excludeTerm={term} isGlossaryMode={true} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const terms = Object.keys(GLOBAL_GLOSSARY).sort();
  
  const filteredTerms = terms
    .filter(t => t.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  return (
    <div className="h-full flex flex-col overflow-hidden relative transition-all">
      <div className="shrink-0 mb-8 text-center pt-2">
        <h1 className="text-3xl font-bold text-[var(--text-bright)] tracking-tight mb-4 transition-all">Глоссарий терминов</h1>
        <p className="text-[var(--text-main)] max-w-2xl mx-auto mb-8 text-sm transition-all">
          Все ключевые понятия машинного обучения в одном месте. 
        </p>
        
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Поиск по терминам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all shadow-sm text-sm text-[var(--text-bright)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-scroll scrollbar-gutter-stable no-scrollbar pr-2 pb-8 relative">
        <AnimatePresence mode="popLayout">
          {filteredTerms.length > 0 ? (
            <motion.div 
              key="grid"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1 relative items-stretch min-h-full"
            >
              {filteredTerms.map(term => (
                <GlossaryCard key={term} term={term} data={GLOBAL_GLOSSARY[term]} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-4xl mb-4 grayscale opacity-40">🔍</div>
              <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs">Ничего не найдено</p>
              <p className="text-[var(--text-muted)] opacity-70 text-sm mt-1">Попробуйте изменить запрос</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
