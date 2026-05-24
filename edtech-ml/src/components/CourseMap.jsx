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
      className={`group relative w-full flex flex-col p-5 border rounded-2xl transition-all duration-300 text-left bg-[var(--bg-card)] shadow-sm
        ${isCompleted 
          ? 'border-emerald-500 border-2' 
          : 'border-[var(--border-main)] hover:border-indigo-500 dark:hover:border-indigo-900 hover:shadow-md hover:-translate-y-0.5'
        }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[15px] font-bold leading-snug transition-colors ${isCompleted ? 'text-[var(--text-main)] opacity-70' : 'text-[var(--text-bright)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
          Урок {index + 1}: {lesson.title.replace(/^Урок\s+\d+:\s*/i, '')}
        </span>
        {isCompleted && (
          <div className="shrink-0 ml-3 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border-light)]">
        <div className={`w-2 h-2 rounded-full ${difficultyColors[lesson.difficulty] || 'bg-slate-300'}`}></div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
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
        <h4 className="text-xl font-bold text-[var(--text-bright)] tracking-tight whitespace-nowrap">
          {chapterName}
        </h4>
        <div className="h-px w-full bg-[var(--border-main)]" />
        <div className="shrink-0 text-[10px] font-bold text-[var(--text-main)] uppercase tracking-widest bg-[var(--bg-subpanel)] px-4 py-2 rounded-lg border border-[var(--border-main)] transition-all">
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
      className="w-full max-w-5xl mx-auto pb-24 no-scrollbar overflow-y-auto h-full"
    >
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-[var(--text-muted)] hover:text-indigo-600 transition-colors mb-8"
      >
        <div className="w-8 h-8 rounded-full border border-[var(--border-main)] flex items-center justify-center group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest">К модулям</span>
      </button>

      <div className="mb-16 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-bright)] tracking-tight mb-4">{moduleName}</h2>
          <p className="text-[var(--text-main)] text-lg leading-relaxed">
            Поэтапное изучение концепций и алгоритмов. Каждый раздел закрепляется практическими заданиями.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center min-w-[240px] transition-all relative overflow-visible">
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* Круговой прогресс - увеличен */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-[var(--border-main)] opacity-70"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 64}
                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - progress / 100) }}
                strokeLinecap="round"
                fill="transparent"
                className="text-indigo-600 dark:text-indigo-400"
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[var(--text-bright)] leading-none tabular-nums">{progress}%</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1.5">Прогресс</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {chapters.map((chapterName) => (
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

const ModuleIcon = ({ idx }) => {
  const themes = [
    { bg: 'bg-indigo-500/10', stroke: 'text-indigo-500', svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" strokeLinecap="round"/><path d="M18 9l-6 6-4-4-5 5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="18" cy="9" r="1" fill="currentColor"/></svg>) },
    { bg: 'bg-emerald-500/10', stroke: 'text-emerald-500', svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18" strokeLinecap="round"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="16.5" r="1.5" fill="currentColor"/></svg>) },
    { bg: 'bg-rose-500/10', stroke: 'text-rose-500', svg: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/><circle cx="6" cy="12" r="3"/><path d="M9 12h6M15.5 6.5l-6.5 4M15.5 17.5l-6.5-4" strokeLinecap="round"/></svg>) }
  ];
  const theme = themes[idx % themes.length];
  return <div className={`w-14 h-14 ${theme.bg} rounded-lg flex items-center justify-center p-3 ${theme.stroke} group-hover:scale-110 transition-transform duration-500`}>{theme.svg}</div>;
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
            className="relative bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-10 text-left shadow-sm hover:shadow-xl hover:border-indigo-500 dark:hover:border-indigo-900 transition-all group flex flex-col h-full overflow-hidden"
          >
            <div className="relative z-10">
              <ModuleIcon idx={idx} />
              <h3 className="text-2xl font-bold text-[var(--text-bright)] leading-tight mt-8 mb-4 group-hover:text-indigo-600 transition-colors">{moduleName}</h3>
              <p className="text-[var(--text-main)] text-sm mb-10 flex-1 leading-relaxed line-clamp-3">Погрузитесь в {moduleName.toLowerCase()}. Вас ждут {moduleLessons.length} практических уроков, формулы и интерактивные задания.</p>
            </div>
            <div className="mt-auto relative z-10 pt-4 border-t border-[var(--border-light)]">
              <div className="flex justify-between items-end mb-3">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Прогресс обучения</span>
                <span className="text-sm font-bold text-[var(--text-main)] tabular-nums">{progress}%</span>
              </div>
              <div className="h-2.5 w-full bg-[var(--border-main)] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}/>
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
        <motion.div key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text-bright)] tracking-tight mb-4 transition-all">Траектория обучения</h1>
            <p className="text-[var(--text-main)] max-w-2xl mx-auto transition-all">Выберите модуль, чтобы погрузиться в изучение Machine Learning через практику и интерактив.</p>
          </div>
          <ModuleGrid lessons={lessons} onSelectModule={setSelectedModule} />
        </motion.div>
      ) : (
        <ModuleView key="module" moduleName={selectedModule} lessons={lessons} onSelectLesson={onSelectLesson} onBack={() => setSelectedModule(null)}/>
      )}
    </AnimatePresence>
  );
}
