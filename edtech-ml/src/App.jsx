import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CourseMap from './components/CourseMap';
import PythonSandbox from './components/PythonSandbox';
import GeometryBoard from './components/GeometryBoard';
import MarkdownBlock from './components/MarkdownBlock';
import { lessons } from './content/lessons';
import { TRANSITIONS } from './utils/constants';

function App() {
  const [currentLesson, setCurrentLesson] = useState(null);

  const resetLesson = () => setCurrentLesson(null);

  return (
    <div className="min-h-screen bg-[#FCFCFC] font-sans text-slate-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={resetLesson} className="font-bold text-lg tracking-tight">ML Academy</button>
          <nav className="flex gap-6 text-sm font-medium text-slate-600">
            <button onClick={resetLesson} className="hover:text-blue-600 transition-colors">Курсы</button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 flex-1 overflow-y-auto scrollbar-stable">
        <AnimatePresence>
          {currentLesson ? (
            <motion.div 
              key="lesson"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={TRANSITIONS.PAGE}
              className="space-y-10"
            >
              <button 
                onClick={resetLesson} 
                className="text-sm text-slate-400 hover:text-slate-900 transition-colors"
              >
                ← Вернуться к карте
              </button>
              
              <h1 className="text-5xl font-black text-slate-950 tracking-tight">
                {currentLesson.title}
              </h1>

              <div className="prose prose-slate max-w-none">
                <MarkdownBlock content={currentLesson.theory} />
              </div>

              {currentLesson.hasGeometry && (
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <GeometryBoard />
                </div>
              )}

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold mb-6 text-slate-900">Практика</h3>
                <PythonSandbox 
                  key={currentLesson.id}
                  lessonId={currentLesson.id}
                  initialCode={currentLesson.practice.initialCode}
                  testCode={currentLesson.practice.testCode}
                />
              </div>
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
    </div>
  );
}

export default App;