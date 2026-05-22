import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CourseMap({ lessons, onSelectLesson }) {
  const [expandedModule, setExpandedModule] = useState(null);
  const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
  const modules = [...new Set(lessons.map(l => l.module))];

  return (
    <div className="space-y-4">
      {modules.map(moduleName => {
        const moduleLessons = lessons.filter(l => l.module === moduleName);
        const completedCount = moduleLessons.filter(l => completedLessons.includes(l.id)).length;
        const progress = Math.round((completedCount / moduleLessons.length) * 100);
        const isExpanded = expandedModule === moduleName;

        return (
          <div key={moduleName} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button 
              onClick={() => setExpandedModule(isExpanded ? null : moduleName)}
              className="group w-full p-8 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
              {/* Левая часть: заголовок */}
              <div>
                <h3 className="text-lg font-bold text-slate-950">{moduleName}</h3>
                <p className="text-sm text-slate-500 mt-1">{moduleLessons.length} уроков</p>
              </div>

              {/* Правая часть: прогресс и стрелка */}
              <div className="flex items-center gap-6">
                {/* Капсула прогресса */}
                <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200/60">
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

                {/* Стрелка */}
                <motion.div 
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
                    height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.2 } 
                  }}
                >
                  <div className="px-8 pb-8 pt-2 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {moduleLessons.map(lesson => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
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
                                <span className="flex-shrink-0 ml-2 text-green-600">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                </span>
                              ) : (
                                <span className="flex-shrink-0 ml-2 text-slate-300 group-hover:text-blue-400">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-medium mt-2 ${isCompleted ? 'text-green-700/70' : 'text-slate-400'}`}>
                              {isCompleted ? 'Пройдено' : lesson.difficulty}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}