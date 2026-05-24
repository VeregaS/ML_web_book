import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseMap from './components/CourseMap';
import LessonModule from './components/LessonModule';
import GlossaryPage from './components/GlossaryPage';
import XPTracker from './components/XPTracker';
import ToastContainer from './components/Toast';
import { lessons } from './content/lessons';
import { TRANSITIONS } from './utils/constants';

function App() {
  const [view, setView] = useState('map'); // 'map', 'lesson', 'glossary'
  const [currentLesson, setCurrentLesson] = useState(null);

  const showCourses = () => {
    setView('map');
    setCurrentLesson(null);
  };

  const showGlossary = () => {
    setView('glossary');
    setCurrentLesson(null);
  };

  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setView('lesson');
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] font-sans text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={showCourses} className="font-bold text-lg tracking-tight">ML Academy</button>
          
          <div className="flex items-center gap-8">
            <XPTracker />
            <nav className="flex gap-6 text-sm font-medium text-slate-600">
              <button 
                onClick={showCourses} 
                className={`transition-colors ${view === 'map' || view === 'lesson' ? 'text-indigo-600' : 'hover:text-blue-600'}`}
              >
                Курсы
              </button>
              <button 
                onClick={showGlossary} 
                className={`transition-colors ${view === 'glossary' ? 'text-indigo-600' : 'hover:text-blue-600'}`}
              >
                Глоссарий
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-6 py-6 flex-1 min-h-0 ${view === 'lesson' ? 'max-w-7xl w-full overflow-hidden' : 'max-w-6xl w-full'}`}>
        <AnimatePresence mode="wait">
          {view === 'lesson' && currentLesson ? (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
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
              className="w-full h-full overflow-y-auto custom-scrollbar"
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
              className="w-full h-full overflow-y-auto custom-scrollbar"
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