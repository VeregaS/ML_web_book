import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseMap from './components/CourseMap';
import LessonModule from './components/LessonModule';
import XPTracker from './components/XPTracker';
import ToastContainer from './components/Toast';
import { lessons } from './content/lessons';
import { TRANSITIONS } from './utils/constants';

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);

  const resetLesson = () => setCurrentLesson(null);

  return (
    <div className="min-h-screen bg-[#FCFCFC] font-sans text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={resetLesson} className="font-bold text-lg tracking-tight">ML Academy</button>
          
          <div className="flex items-center gap-8">
            <XPTracker />
            <nav className="flex gap-6 text-sm font-medium text-slate-600">
              <button onClick={resetLesson} className="hover:text-blue-600 transition-colors">Курсы</button>
            </nav>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-6 py-12 flex-1 overflow-y-auto scrollbar-stable ${currentLesson ? 'max-w-7xl w-full' : 'max-w-5xl w-full'}`}>
        <AnimatePresence mode="wait">
          {currentLesson ? (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={TRANSITIONS.PAGE}
              className="h-full"
            >
              <LessonModule lesson={currentLesson} onBack={resetLesson} />
            </motion.div>
          ) : (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={TRANSITIONS.PAGE}
              className="w-full"
            >
              <CourseMap lessons={lessons} onSelectLesson={setCurrentLesson} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;