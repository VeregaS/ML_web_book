import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';
import { TRANSITIONS } from '../utils/constants';

const LessonItem = ({ lesson, isCompleted, onSelect }) => (
  <button
    onClick={() => onSelect(lesson)}
    className={`group relative w-full flex flex-col p-4 border rounded-lg transition-all duration-200 text-left 
      ${isCompleted 
        ? 'bg-white border-slate-200 border-l-4 border-l-emerald-500 shadow-sm' 
        : 'bg-white border-slate-100 hover:border-indigo-400 shadow-sm'
      }`}
  >
    <div className="flex justify-between items-center">
      <span className={`text-sm font-bold transition-colors ${isCompleted ? 'text-slate-700' : 'text-slate-900 group-hover:text-indigo-600'}`}>
        {lesson.title}
      </span>
      {isCompleted && (
        <span className="shrink-0 ml-2 text-emerald-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </div>
    <span className="text-[11px] font-semibold mt-1.5 text-slate-400 uppercase tracking-widest">
      {isCompleted ? 'Пройдено' : lesson.difficulty}
    </span>
  </button>
);

const ModuleCard = ({ moduleName, lessons, completedLessons, onSelectLesson }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const moduleLessons = lessons.filter(l => l.module === moduleName);
  const completedCount = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
  const progress = Math.round((completedCount / moduleLessons.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full mb-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="group w-full p-5 flex items-center justify-between gap-6 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{moduleName}</h3>
          <p className="text-xs text-slate-500 mt-1">{moduleLessons.length} уроков</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-2 w-28 bg-slate-100 rounded-sm overflow-hidden">
              <motion.div 
                className={`h-full transition-colors duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-semibold text-slate-700 tabular-nums w-10 text-right">
              {progress}%
            </span>
          </div>

          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-300 group-hover:text-indigo-400 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {moduleLessons.map(lesson => (
                  <LessonItem 
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={completedLessons.includes(lesson.id)}
                    onSelect={onSelectLesson}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CourseMap({ lessons, onSelectLesson }) {
  const completedLessons = storage.getCompletedLessons();
  const modules = [...new Set(lessons.map(l => l.module))];

  return (
    <div className="space-y-1 w-full max-w-4xl mx-auto">
      {modules.map(moduleName => (
        <ModuleCard 
          key={moduleName}
          moduleName={moduleName}
          lessons={lessons}
          completedLessons={completedLessons}
          onSelectLesson={onSelectLesson}
        />
      ))}
    </div>
  );
}
