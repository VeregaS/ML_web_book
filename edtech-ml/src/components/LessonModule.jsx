import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from './MarkdownBlock';
import SandboxEditor from './Sandbox/SandboxEditor';
import SandboxConsole from './Sandbox/SandboxConsole';
import SandboxPlots from './Sandbox/SandboxPlots';
import InteractiveRegression from './InteractiveRegression';
import JupyterSandbox from './JupyterSandbox';
import { usePyodide } from '../hooks/usePyodide';
import { useProgress } from '../context/ProgressContext';
import { storage } from '../utils/storage';
import { TRANSITIONS } from '../utils/constants';

export default function LessonModule({ lesson, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const stepData = lesson.steps[currentStep];

  const { isLoading, runPython, interrupt } = usePyodide();
  const { addXP } = useProgress();
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); 
  const [completedSteps, setCompletedSteps] = useState([]);

  // Загружаем список пройденных шагов для текущего урока
  useEffect(() => {
    const passed = lesson.steps
      .map((_, idx) => idx)
      .filter(idx => storage.isStepCompleted(lesson.id, idx));
    setCompletedSteps(passed);
  }, [lesson.id, lesson.steps]);

  useEffect(() => {
    const savedCode = storage.getLessonCode(`${lesson.id}-step-${currentStep}`, stepData.initialCode);
    setCode(savedCode);
    setOutput('');
    setPlots([]);
    setTestStatus(null);
  }, [currentStep, lesson.id, stepData]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    storage.saveLessonCode(`${lesson.id}-step-${currentStep}`, newCode);
  };

  const handleReset = () => {
    if (window.confirm("Вы уверены, что хотите сбросить код до начального состояния? Все изменения на этом шаге будут потеряны.")) {
      setCode(stepData.initialCode);
      storage.clearLessonCode(`${lesson.id}-step-${currentStep}`);
      setOutput('');
      setPlots([]);
      setTestStatus(null);
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]);
    setTestStatus(null);
    
    const testsToRun = (withTests && stepData.testCode) ? stepData.testCode : null;

    try {
      const { result, output: stdout, plots: newPlots } = await runPython(code, testsToRun);
      
      let finalOutput = stdout;
      if (result !== undefined) {
        finalOutput += `\n[Результат]: ${result}`;
      }

      if (finalOutput.trim() === '') {
        finalOutput = withTests 
          ? '[Тесты пройдены, но ничего не выведено]' 
          : '[Код выполнен успешно. Вывода на экран нет.]';
      }

      setOutput(finalOutput.trim());
      setPlots(newPlots || []);
      
      if (withTests) {
        setTestStatus('success');
        
        if (!storage.isStepCompleted(lesson.id, currentStep)) {
          addXP(10);
          storage.setStepCompleted(lesson.id, currentStep);
          setCompletedSteps(prev => [...prev, currentStep]);
        }

        if (currentStep === lesson.steps.length - 1) {
          storage.setLessonCompleted(lesson.id);
        }
      }
    } catch (err) {
      if (withTests && err.message.includes('AssertionError')) {
        setTestStatus('error');
        const lines = err.message.split('\n');
        const assertError = lines.find(line => line.includes('AssertionError')) || 'Тесты не пройдены.';
        setOutput(`[ОШИБКА ПРОВЕРКИ]: ${assertError}`);
      } else {
        setOutput(`[Ошибка выполнения]:\n${err.message}`);
        setTestStatus('error');
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInterrupt = () => {
    interrupt();
    setIsExecuting(false);
    setOutput('[Прервано]: Процесс остановлен. Среда перезагружается...');
    setTestStatus('error');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Инициализация среды Python...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all shadow-sm font-medium">
          ← Назад
        </button>
        <h1 className="text-2xl font-black text-slate-950 tracking-tight m-0">{lesson.title}</h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           {/* Step Navigation Bar */}
           <div className="flex gap-2 p-6 border-b border-slate-100 bg-slate-50/50">
             {lesson.steps.map((_, idx) => {
                const isActive = idx === currentStep;
                const isDone = completedSteps.includes(idx);
                return (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentStep(idx)}
                    className={`h-4 flex-1 rounded-full transition-all duration-300 flex items-center justify-center relative ${
                      isActive ? 'ring-4 ring-blue-100' : ''
                    } ${
                      isDone ? 'bg-green-500 hover:bg-green-600' : 
                      isActive ? 'bg-blue-600' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={isDone ? `Шаг ${idx + 1} (Пройдено)` : `Шаг ${idx + 1}`}
                  >
                    {isDone && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
             })}
           </div>
           
           <div className="p-8 overflow-y-auto flex-1 prose prose-slate max-w-none relative">
             {completedSteps.includes(currentStep) && (
               <div className="absolute top-6 right-8 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 Завершено
               </div>
             )}
             <MarkdownBlock content={stepData.theory} />
             
             {stepData.type === 'regression' && (
               <div className="my-8 p-6 bg-slate-50 rounded-3xl border border-slate-100"><InteractiveRegression /></div>
             )}
             {stepData.type === 'jupyter' && (
               <JupyterSandbox />
             )}
             
             {stepData.task && (
               <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/60 shadow-sm">
                  <h3 className="text-blue-900 mt-0 flex items-center gap-2">📝 Задание</h3>
                  <MarkdownBlock content={stepData.task} />
               </div>
             )}
           </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
           <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                 <SandboxEditor code={code} onChange={handleCodeChange} onReset={handleReset} />
                 
                 <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex gap-3">
                      <button onClick={() => executeCode(false)} disabled={isExecuting} className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">▶ Запустить</button>
                      {stepData.testCode && (
                        <button onClick={() => executeCode(true)} disabled={isExecuting} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
                          ✔ Проверить
                        </button>
                      )}
                    </div>
                    {isExecuting && <button onClick={handleInterrupt} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold animate-pulse">⏹ Стоп</button>}
                 </div>

                 <AnimatePresence mode="wait">
                    {testStatus === 'success' && (
                       <motion.div initial={{opacity:0, height:0, y:-10}} animate={{opacity:1, height:'auto', y:0}} className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl font-bold flex justify-between items-center shadow-sm overflow-hidden">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🎉</span>
                            <span>Решение верное!</span>
                          </div>
                          {currentStep < lesson.steps.length - 1 && (
                            <button onClick={() => setCurrentStep(s => s + 1)} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">Далее →</button>
                          )}
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="h-48 shrink-0 overflow-hidden"><SandboxConsole output={output} testStatus={testStatus} /></div>
              </div>
           </div>
           <SandboxPlots plots={plots} />
        </div>
      </div>
    </div>
  );
}
