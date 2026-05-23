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
      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-500 h-full flex flex-col target:ring-4 target:ring-indigo-500/30 target:border-indigo-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
        <h3 className="text-lg font-bold text-slate-900">{term}</h3>
      </div>
      
      <div className="text-[14px] text-slate-600 leading-relaxed mb-6 custom-glossary-content">
        <MarkdownBlock content={data.definition} excludeTerm={term} isGlossaryMode={true} />
      </div>

      {data.example && (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-auto overflow-hidden">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block">
            Пример / Аналогия
          </span>
          <div className="text-[14px] text-slate-700 italic leading-relaxed custom-glossary-content">
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
    <div className="h-full flex flex-col overflow-hidden relative">
      {/* Search Header - Fixed */}
      <div className="shrink-0 mb-8 text-center pt-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Глоссарий терминов</h1>
        <p className="text-slate-500 max-w-2xl mx-auto mb-8 text-sm">
          Все ключевые понятия машинного обучения в одном месте. 
        </p>
        
        <div className="relative max-w-md mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text"
            placeholder="Поиск по терминам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-sm"
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-scroll scrollbar-gutter-stable no-scrollbar pr-2 pb-8 relative">
        <AnimatePresence mode="popLayout">
          {filteredTerms.length > 0 ? (
            <motion.div 
              key="grid"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1 relative items-stretch min-h-full"
            >
              {filteredTerms.map(term => (
                <GlossaryCard key={term} term={term} data={GLOBAL_GLOSSARY[term]} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-4xl mb-4 grayscale opacity-40">🔍</div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ничего не найдено</p>
              <p className="text-slate-300 text-sm mt-1">Попробуйте изменить запрос</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
