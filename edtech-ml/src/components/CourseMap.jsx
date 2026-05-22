import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../utils/storage';
import { TRANSITIONS } from '../utils/constants';

const LessonItem = ({ lesson, isCompleted, onSelect }) => (
  <button
    onClick={() => onSelect(lesson)}
    className={`group relative w-full flex flex-col p-5 border rounded-2xl transition-all duration-200 text-left 
      ${isCompleted 
        ? 'bg-green-50/50 border-green-200 hover:border-green-300' 
        : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md'
      }`}
  >
    <div className="flex justify-between items-start">
      <span className={`font-bold transition-colors ${isCompleted ? 'text-green-800' : 'text-slate-900 group-hover:text-blue-600'}`}>
        {lesson.title}
      </span>
      {isCompleted ? (
        <span className="shrink-0 ml-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </span>
      ) : (
        <span className="shrink-0 ml-2 text-slate-300 group-hover:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </div>
    <span className={`text-xs font-medium mt-2 ${isCompleted ? 'text-green-700/70' : 'text-slate-400'}`}>
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
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="group w-full p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-950">{moduleName}</h3>
          <p className="text-sm text-slate-500 mt-1">{moduleLessons.length} уроков</p>
        </div>

        <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
            <div className="h-2 w-28 bg-slate-200/80 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full transition-colors duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 tabular-nums w-10 text-right">
              {progress}%
            </span>
          </div>

          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={TRANSITIONS.PAGE}
            className="text-slate-400 group-hover:text-slate-600 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            transition={{ 
              height: TRANSITIONS.PAGE,
              opacity: { duration: 0.2 } 
            }}
          >
            <div className="px-8 pb-8 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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
    <div className="space-y-4 w-full">
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
