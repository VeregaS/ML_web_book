import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';
import { TRANSITIONS } from '../utils/constants';

const LessonItem = ({ lesson, index, isCompleted, onSelect }) => {
  const difficultyColors = {
    'Легко': 'bg-emerald-400',
    'Средне': 'bg-amber-400',
    'Сложно': 'bg-rose-400'
  };

  return (
    <button
      onClick={() => onSelect(lesson)}
      className={`group relative w-full flex flex-col p-5 border rounded-2xl transition-all duration-300 text-left bg-white shadow-[0_2px_8px_-1px_rgba(0,0,0,0.05)]
        ${isCompleted 
          ? 'border-emerald-500 border-2 shadow-emerald-50/50' 
          : 'border-slate-200 hover:border-indigo-400 hover:shadow-[0_10px_25px_-5px_rgba(79,70,229,0.1)] hover:-translate-y-0.5'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[15px] font-bold leading-snug transition-colors ${isCompleted ? 'text-slate-600' : 'text-slate-900 group-hover:text-indigo-600'}`}>
          Урок {index + 1}: {lesson.title.replace(/^Урок\s+\d+:\s*/i, '')}
        </span>
        {isCompleted && (
          <div className="shrink-0 ml-3 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50">
        <div className={`w-2 h-2 rounded-full ${difficultyColors[lesson.difficulty] || 'bg-slate-300'}`}></div>
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
          {lesson.difficulty}
        </span>
      </div>
    </button>
  );
};

const ChapterSection = ({ chapterName, lessons, completedLessons, onSelectLesson }) => {
  return (
    <div className="mb-14 last:mb-0">
      <div className="flex items-center gap-4 mb-8">
        <h4 className="text-xl font-semibold text-slate-900 tracking-tight whitespace-nowrap">
          {chapterName}
        </h4>
        <div className="h-px w-full bg-slate-200" />
        <div className="shrink-0 text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          {lessons.length} уроков
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {lessons.map((lesson, idx) => (
          <LessonItem 
            key={lesson.id}
            lesson={lesson}
            index={idx}
            isCompleted={completedLessons.includes(lesson.id)}
            onSelect={onSelectLesson}
          />
        ))}
      </div>
    </div>
  );
};

const ModuleView = ({ moduleName, lessons, onSelectLesson, onBack }) => {
  const completedLessons = storage.getCompletedLessons();
  const moduleLessons = lessons.filter(l => l.module === moduleName);
  const chapters = [...new Set(moduleLessons.map(l => l.chapter || "Общее"))];
  const completedCount = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
  const progress = Math.round((completedCount / moduleLessons.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-5xl mx-auto pb-24"
    >
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8"
      >
        <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest">К модулям</span>
      </button>

      {/* Clean Light Header */}
      <div className="mb-16 border-b border-slate-100 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-1.5 bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Программа модуля</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">{moduleName}</h2>
          <p className="text-slate-500 text-lg leading-relaxed">
            Поэтапное изучение концепций и алгоритмов. Каждый раздел закрепляется практическими заданиями.
          </p>
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center min-w-[200px] shadow-sm">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Твой прогресс</div>
          <div className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{progress}%</div>
          <div className="h-2 w-28 bg-slate-300 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {chapters.map((chapterName, idx) => (
          <ChapterSection 
            key={chapterName}
            chapterName={chapterName}
            lessons={moduleLessons.filter(l => (l.chapter || "Общее") === chapterName)}
            completedLessons={completedLessons}
            onSelectLesson={onSelectLesson}
          />
        ))}
      </div>
    </motion.div>
  );
};

const ModuleIcon = ({ name, idx }) => {
  const themes = [
    { // Math
      bg: 'bg-indigo-50',
      stroke: 'text-indigo-500',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M18 9l-6 6-4-4-5 5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="18" cy="9" r="1" fill="currentColor" />
        </svg>
      )
    },
    { // Algorithms
      bg: 'bg-emerald-50',
      stroke: 'text-emerald-500',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 12h18M12 3v18" strokeLinecap="round" />
          <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
          <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    { // Neural Networks
      bg: 'bg-rose-50',
      stroke: 'text-rose-500',
      svg: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="18" cy="5" r="3" />
          <circle cx="18" cy="19" r="3" />
          <circle cx="6" cy="12" r="3" />
          <path d="M9 12h6M15.5 6.5l-6.5 4M15.5 17.5l-6.5-4" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  const theme = themes[idx % themes.length];

  return (
    <div className={`w-14 h-14 ${theme.bg} rounded-2xl flex items-center justify-center p-3 ${theme.stroke} group-hover:scale-110 transition-transform duration-500`}>
      {theme.svg}
    </div>
  );
};

const ModuleGrid = ({ lessons, onSelectModule }) => {
  const completedLessons = storage.getCompletedLessons();
  const modules = [...new Set(lessons.map(l => l.module))];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto pt-4 pb-24 px-1">
      {modules.map((moduleName, idx) => {
        const moduleLessons = lessons.filter(l => l.module === moduleName);
        const completedCount = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
        const progress = Math.round((completedCount / moduleLessons.length) * 100);
        
        return (
          <motion.button
            key={moduleName}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectModule(moduleName)}
            className="relative bg-white border border-slate-200 rounded-[2.5rem] p-10 text-left shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.15)] hover:border-indigo-200 transition-all group flex flex-col h-full overflow-hidden"
          >
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-indigo-50/30 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700" />
            
            <div className="relative z-10">
              <ModuleIcon name={moduleName} idx={idx} />
              
              <h3 className="text-2xl font-black text-slate-900 leading-tight mt-8 mb-4 group-hover:text-indigo-600 transition-colors">
                {moduleName}
              </h3>
              
              <p className="text-slate-500 text-sm mb-10 flex-1 leading-relaxed line-clamp-3">
                Погрузитесь в {moduleName.toLowerCase()}. Вас ждут {moduleLessons.length} практических уроков, формулы и интерактивные задания.
              </p>
            </div>

            <div className="mt-auto relative z-10 pt-4 border-t border-slate-50">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Прогресс обучения</span>
                <span className="text-sm font-black text-slate-700">{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]'}`}
                />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default function CourseMap({ lessons, onSelectLesson }) {
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <AnimatePresence mode="wait">
      {!selectedModule ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Траектория обучения</h1>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Выберите модуль, чтобы погрузиться в изучение Machine Learning через практику и интерактив.
            </p>
          </div>
          <ModuleGrid lessons={lessons} onSelectModule={setSelectedModule} />
        </motion.div>
      ) : (
        <ModuleView 
          key="module"
          moduleName={selectedModule}
          lessons={lessons}
          onSelectLesson={onSelectLesson}
          onBack={() => setSelectedModule(null)}
        />
      )}
    </AnimatePresence>
  );
}
