import { useState, useEffect } from 'react';
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
  
  // ПОДНИМАЕМ СОСТОЯНИЕ ВЫБРАННОГО МОДУЛЯ В APP
  // Чтобы при выходе из урока мы могли сказать CourseMap "покажи этот модуль"
  const [activeModule, setActiveModule] = useState(null); 

  const { theme, toggleTheme } = useTheme();
  const { closeAll } = useTooltips();

  const showCourses = () => {
    closeAll();
    setActiveModule(null); // Сброс до главной сетки модулей
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

  const exitLesson = () => {
    closeAll();
    if (currentLesson) {
      // Сохраняем модуль текущего урока, чтобы CourseMap открылся на нем
      setActiveModule(currentLesson.module); 
    }
    setView('map');
    setCurrentLesson(null);
  };

  // Автоматическое закрытие всех подсказок при смене вида
  useEffect(() => {
    closeAll();
  }, [view, currentLesson]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${view !== 'lesson' ? 'no-scrollbar overflow-y-auto' : ''}`}>
      <header className="sticky top-0 z-50 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--border-main)] transition-colors h-16 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-start items-center">
            {/* Клик по логотипу всегда ведет в самый корень */}
            <button onClick={showCourses} className="group flex items-center gap-3 font-semibold text-xl tracking-tighter text-[var(--text-bright)] hover:opacity-90 transition-opacity whitespace-nowrap">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-indigo-400 flex items-center justify-center text-white shadow-md shadow-[var(--accent-primary)]/20 group-hover:scale-105 transition-transform">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline><polyline points="7.5 19.79 7.5 14.6 3 12"></polyline><polyline points="21 12 16.5 14.6 16.5 19.79"></polyline><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <span className="hidden sm:block">ML Academy</span>
            </button>
          </div>
          
          <nav className="flex bg-[var(--bg-subpanel)] border border-[var(--border-main)] p-1 rounded-full shadow-inner">
             {/* Кнопка Курсы тоже ведет в корень */}
             <button 
                onClick={showCourses} 
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${view === 'map' || view === 'lesson' ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/50'}`}
              >
                Курсы
              </button>
              <button 
                onClick={showGlossary} 
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${view === 'glossary' ? 'bg-[var(--bg-card)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/50'}`}
              >
                Глоссарий
              </button>
          </nav>

          <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
            <XPTracker />
            <button 
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border-main)] text-[var(--text-main)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all active:scale-95 shrink-0 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                /* Луна */
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                /* Солнце */
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              {/* Передаем exitLesson как коллбэк для кнопки Выход внутри урока */}
              <LessonModule lesson={currentLesson} onBack={exitLesson} />
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
              {/* Передаем активный модуль в CourseMap, чтобы он мог сразу его открыть */}
              <CourseMap 
                lessons={lessons} 
                onSelectLesson={startLesson} 
                activeModule={activeModule} 
                setActiveModule={setActiveModule} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;
