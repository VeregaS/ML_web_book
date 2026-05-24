import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseMap from './components/CourseMap';
import LessonModule from './components/LessonModule';
import GlossaryPage from './components/GlossaryPage';
import XPTracker from './components/XPTracker';
import ToastContainer from './components/Toast';
import { lessons } from './content/lessons';
import { TRANSITIONS } from './utils/constants';
import { useTheme } from './context/ThemeContext';
import { useTooltips } from './context/TooltipContext';

function App() {
  const [view, setView] = useState('map'); // 'map', 'lesson', 'glossary'
  const [currentLesson, setCurrentLesson] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { closeAll } = useTooltips();

  const showCourses = () => {
    closeAll();
    setView('map');
    setCurrentLesson(null);
  };

  const showGlossary = () => {
    closeAll();
    setView('glossary');
    setCurrentLesson(null);
  };

  const startLesson = (lesson) => {
    closeAll();
    setCurrentLesson(lesson);
    setView('lesson');
  };

  // Автоматическое закрытие всех подсказок при смене вида
  useEffect(() => {
    closeAll();
  }, [view, currentLesson]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${view !== 'lesson' ? 'no-scrollbar overflow-y-auto' : ''}`}>
      <header className="sticky top-0 z-50 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border-light)] transition-colors h-16 shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex-1 flex justify-start">
            <button onClick={showCourses} className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity whitespace-nowrap">
              ML Academy
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex-none">
              <XPTracker />
            </div>
            
            <nav className="flex gap-6 text-sm font-medium whitespace-nowrap">
              <button 
                onClick={showCourses} 
                className={`transition-colors w-16 ${view === 'map' || view === 'lesson' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)] hover:text-indigo-500'}`}
              >
                Курсы
              </button>
              <button 
                onClick={showGlossary} 
                className={`transition-colors w-20 ${view === 'glossary' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)] hover:text-indigo-500'}`}
              >
                Глоссарий
              </button>
            </nav>

            <div className="w-10 h-10 flex items-center justify-end">
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-[var(--border-light)] border border-[var(--border-main)] text-[var(--text-main)] hover:scale-105 transition-all active:scale-95 shadow-sm shrink-0"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-6 py-6 flex-1 min-h-0 no-scrollbar ${view === 'lesson' ? 'max-w-7xl w-full overflow-hidden' : 'max-w-6xl w-full overflow-y-auto'}`}>
        <AnimatePresence mode="wait">
          {view === 'lesson' && currentLesson ? (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={TRANSITIONS.PAGE}
              className="h-full flex flex-col"
            >
              <LessonModule lesson={currentLesson} onBack={showCourses} />
            </motion.div>
          ) : view === 'glossary' ? (
            <motion.div 
              key="glossary"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={TRANSITIONS.PAGE}
              className="w-full h-full"
            >
              <GlossaryPage />
            </motion.div>
          ) : (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={TRANSITIONS.PAGE}
              className="w-full h-full"
            >
              <CourseMap lessons={lessons} onSelectLesson={startLesson} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;
