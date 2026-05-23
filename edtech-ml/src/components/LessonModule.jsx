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
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'task'
  const stepData = lesson.steps[currentStep];

  const { isLoading, runPython, interrupt } = usePyodide();
  const { xp, addXP, spendXP, unlockedTests } = useProgress();
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); 
  const [completedSteps, setCompletedSteps] = useState([]);

  // Ключ для разблокировки подсказки
  const currentHintKey = `${lesson.id}-step-${currentStep}_hint`;
  const isHintUnlocked = unlockedTests.includes(currentHintKey);

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
        finalOutput = withTests ? '[Тесты пройдены]' : '[Код выполнен успешно]';
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
      <div className="flex flex-col items-center justify-center h-screen bg-[#FCFCFC]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Initialising Python Engine</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* 1. Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4 bg-white border border-slate-200 rounded-lg p-2 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[10px] px-2.5 py-1.5 border border-slate-200 rounded-md text-slate-500 hover:text-slate-900 transition-all font-bold uppercase tracking-wider bg-slate-50/50 shadow-sm active:scale-95">
            Выход
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <h1 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{lesson.title}</h1>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border border-slate-200/50">
          {lesson.steps.map((_, idx) => {
            const isActive = idx === currentStep;
            const isDone = completedSteps.includes(idx);
            return (
              <button 
                key={idx} 
                onClick={() => setCurrentStep(idx)}
                className={`group relative flex items-center justify-center w-8 h-6 rounded transition-all ${
                  isActive ? 'bg-indigo-600 text-white shadow-sm' : 
                  isDone ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'bg-transparent text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span className="text-[10px] font-black">{idx + 1}</span>
                {isDone && !isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
          {currentStep + 1} / {lesson.steps.length}
        </div>
      </div>
      
      {/* 2. Main Workspace (Height Fixed) */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT: Description/Task Tabs */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm min-w-0 overflow-hidden">
           <div className="flex items-center bg-slate-50 border-b border-slate-200 px-2 h-10 shrink-0">
              <button 
                onClick={() => setActiveTab('theory')}
                className={`px-5 h-full text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'theory' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Описание
              </button>
              <button 
                onClick={() => setActiveTab('task')}
                className={`px-5 h-full text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === 'task' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Задание
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <AnimatePresence mode="wait">
                {activeTab === 'theory' ? (
                  <motion.div 
                    key="theory"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="prose prose-slate prose-sm max-w-none"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Шаг {currentStep + 1}</h2>
                    <MarkdownBlock content={stepData.theory} />
                    {stepData.type === 'regression' && <div className="my-8"><InteractiveRegression /></div>}
                    {stepData.type === 'jupyter' && <div className="my-8"><JupyterSandbox /></div>}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="task"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="prose prose-slate prose-sm max-w-none"
                  >
                    <h2 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Практическое задание</h2>
                    <div className="text-slate-800 text-sm leading-relaxed mb-10">
                      <MarkdownBlock content={stepData.task} />
                    </div>

                    {/* Hint Section (Minimalist Design) */}
                    {stepData.hint && (
                      <div className="mt-10 border-t border-slate-100 pt-6 pb-4">
                        {!isHintUnlocked ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Нужна помощь?</span>
                            <button 
                              onClick={() => spendXP(20, currentHintKey)}
                              disabled={xp < 20}
                              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 disabled:text-slate-300 transition-colors"
                            >
                              Открыть подсказку за 20 XP
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 m-0">Совет наставника</h3>
                            <div className="text-[13px] text-slate-600 leading-relaxed opacity-90">
                              <MarkdownBlock content={stepData.hint} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* RIGHT: IDE + Footer + Console */}
        <div className="flex-[1.2] flex flex-col gap-4 min-w-0 overflow-hidden h-full">
          
          {/* IDE Block */}
          <div className="flex-1 flex flex-col bg-[#282c34] rounded-lg border border-slate-200 overflow-hidden shadow-sm min-h-0">
             {/* Toolbar */}
             <div className="flex items-center justify-between px-4 h-10 bg-white border-b border-slate-200 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">main.py</span>
                <div className="flex gap-4">
                   <button onClick={handleReset} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors">Сброс</button>
                   <button onClick={() => executeCode(false)} disabled={isExecuting} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors">Запустить</button>
                </div>
             </div>

             {/* Editor Area */}
             <div className="flex-1 min-h-0 relative">
                <SandboxEditor code={code} onChange={handleCodeChange} />
             </div>

             {/* Submit Area */}
             <div className="flex items-center justify-between p-3 bg-white border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-3 px-1">
                  {testStatus === 'success' && <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>Верно</span>}
                  {testStatus === 'error' && <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>Ошибка</span>}
                </div>
                
                <div className="flex gap-2">
                   {stepData.testCode && (
                     <button 
                      onClick={() => executeCode(true)} 
                      disabled={isExecuting}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-50"
                     >
                       {isExecuting ? 'Проверка...' : 'Проверить решение'}
                     </button>
                   )}
                   {testStatus === 'success' && currentStep < lesson.steps.length - 1 && (
                     <button 
                       onClick={() => { setCurrentStep(s => s + 1); setActiveTab('theory'); }}
                       className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                     >
                       Далее
                     </button>
                   )}
                </div>
             </div>
          </div>

          {/* Console Block */}
          <div className="h-44 bg-[#0d1117] rounded-lg border border-slate-800 shadow-xl overflow-hidden flex flex-col shrink-0">
             <div className="px-4 py-1.5 border-b border-slate-800/50 bg-[#161b22] flex justify-between items-center shrink-0">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Терминал</span>
                {isExecuting && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>}
             </div>
             <div className="flex-1 overflow-hidden">
               <SandboxConsole output={output} testStatus={testStatus} />
             </div>
          </div>
          
          <SandboxPlots plots={plots} />
        </div>
      </div>
    </div>
  );
}
