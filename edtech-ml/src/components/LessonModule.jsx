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
  const { xp, addXP, spendXP, unlockedTests } = useProgress();
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); 
  const [completedSteps, setCompletedSteps] = useState([]);

  const currentHintKey = `${lesson.id}-step-${currentStep}_hint`;
  const isHintUnlocked = unlockedTests.includes(currentHintKey);

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
    if (window.confirm("Сбросить код к начальному состоянию?")) {
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
          ? '[Тесты пройдены]' 
          : '[Код выполнен успешно]';
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
      setTestStatus('error');
      setOutput(`[Ошибка выполнения]:\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInterrupt = () => {
    interrupt();
    setIsExecuting(false);
    setOutput('[Прервано]: Среда перезагружается...');
    setTestStatus('error');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Initialising Environment</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="flex items-center gap-2 text-[11px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-all font-bold uppercase tracking-widest shadow-sm">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Назад
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight m-0">{lesson.title}</h1>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Левая панель */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm min-w-0 overflow-hidden">
           <div className="flex gap-1.5 p-4 border-b border-slate-100 bg-slate-50/50">
             {lesson.steps.map((_, idx) => {
                const isActive = idx === currentStep;
                const isDone = completedSteps.includes(idx);
                return (
                  <button 
                    key={idx} 
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 flex-1 rounded-sm transition-all duration-300 ${
                      isActive ? 'bg-indigo-600' : 
                      isDone ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                );
             })}
           </div>
           
           <div className="p-8 overflow-y-auto flex-1 prose prose-slate prose-sm max-w-none relative">
             {completedSteps.includes(currentStep) && (
               <div className="absolute top-8 right-8 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md border border-emerald-100 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                 Завершено
               </div>
             )}
             <MarkdownBlock content={stepData.theory} />
             
             {stepData.type === 'regression' && (
               <div className="my-8 p-6 bg-slate-50 border border-slate-200 rounded-xl"><InteractiveRegression /></div>
             )}
             {stepData.type === 'jupyter' && <JupyterSandbox />}
             
             {stepData.task && (
               <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                  <h3 className="text-slate-900 text-[11px] font-black uppercase tracking-[0.15em] mt-0 mb-4 flex items-center gap-2 text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Задание
                  </h3>
                  <div className="text-slate-700 leading-relaxed"><MarkdownBlock content={stepData.task} /></div>
               </div>
             )}

             {stepData.hint && (
               <div className="mt-6">
                 {!isHintUnlocked ? (
                   <button 
                     onClick={() => spendXP(20, currentHintKey)}
                     disabled={xp < 20}
                     className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                       xp >= 20 
                       ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-md active:scale-[0.98]' 
                       : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                     }`}
                   >
                     <span>💡 Нужна подсказка?</span>
                     <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">20 XP</span>
                   </button>
                 ) : (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-amber-50 border border-amber-100 rounded-xl shadow-sm">
                     <div className="text-sm text-amber-900 leading-relaxed">
                       <span className="font-black block mb-2 uppercase text-[10px] tracking-widest text-amber-600">Совет наставника</span>
                       {stepData.hint}
                     </div>
                   </motion.div>
                 )}
               </div>
             )}
           </div>
        </div>

        {/* Правая панель */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
           <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
                 <SandboxEditor code={code} onChange={handleCodeChange} onReset={handleReset} />
                 
                 <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-white">
                    <div className="flex gap-3">
                      <button onClick={() => executeCode(false)} disabled={isExecuting} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95">▶ Запустить</button>
                      {stepData.testCode && (
                        <button onClick={() => executeCode(true)} disabled={isExecuting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                          ✔ Проверить решение
                        </button>
                      )}
                    </div>
                    {isExecuting && (
                      <button onClick={handleInterrupt} className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-700 tracking-widest px-2 animate-pulse transition-colors">
                        Прервать
                      </button>
                    )}
                 </div>

                 <AnimatePresence mode="wait">
                    {testStatus === 'success' && (
                       <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mx-4 mb-4 p-4 bg-emerald-50/50 border-l-4 border-emerald-500 border border-slate-200 rounded-r-lg text-slate-800 text-sm font-bold flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span>Задание выполнено верно!</span>
                          </div>
                          {currentStep < lesson.steps.length - 1 && (
                            <button onClick={() => setCurrentStep(s => s + 1)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-md text-[10px] font-black hover:bg-emerald-600 uppercase tracking-wider transition-all">Далее</button>
                          )}
                       </motion.div>
                    )}
                    {testStatus === 'error' && (
                       <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mx-4 mb-4 p-4 bg-rose-50/50 border-l-4 border-rose-500 border border-slate-200 rounded-r-lg text-slate-800 text-sm font-bold shadow-sm flex items-center gap-3">
                          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          <span>Ошибка выполнения. Проверьте консоль.</span>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="h-56 shrink-0 border-t border-slate-100 bg-slate-900 rounded-b-xl overflow-hidden">
                   <SandboxConsole output={output} testStatus={testStatus} />
                 </div>
              </div>
           </div>
           <SandboxPlots plots={plots} />
        </div>
      </div>
    </div>
  );
}
