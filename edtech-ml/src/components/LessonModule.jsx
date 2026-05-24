import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from './MarkdownBlock';
import SandboxEditor from './Sandbox/SandboxEditor';
import SandboxConsole from './Sandbox/SandboxConsole';
import SandboxPlots from './Sandbox/SandboxPlots';
import DataViewer from './Sandbox/DataViewer';
import TestResultsViewer from './Sandbox/TestResultsViewer';
import QuizTask from './QuizTask';
import InteractiveRegression from './InteractiveRegression';
import SVMBoard from './SVMBoard';
import GradientDescentBoard from './GradientDescentBoard';
import JupyterSandbox from './JupyterSandbox';
import { usePyodide } from '../hooks/usePyodide';
import { useProgress } from '../context/ProgressContext';
import { storage } from '../utils/storage';

// Вспомогательный компонент для подсказок
const HintBlock = ({ stepData, isHintUnlocked, xp, spendXP, currentHintKey, lessonGlossary, isQuiz }) => {
  if (!stepData?.hint) return null;

  // ЛОГИКА ВЫСОТЫ:
  // В квизе: кнопка максимально сжата (h-[80px]), открытый совет по контенту (h-fit)
  // В коде: кнопка растянута (flex-1), открытый совет растянут (flex-1)
  const containerStyle = isQuiz 
    ? (isHintUnlocked ? "h-fit" : "h-[80px] shrink-0")
    : "flex-1 min-h-[140px]";

  return (
    <div className={`flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${containerStyle}`}>
      {!isHintUnlocked ? (
        <button 
          onClick={() => spendXP(20, currentHintKey)} 
          disabled={xp < 20} 
          className={`w-full h-full flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl hover:border-[var(--accent-primary)] transition-colors duration-300 group shadow-sm active:scale-[0.98] ${isQuiz ? 'px-4 py-2' : 'p-6'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`${isQuiz ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl'} bg-[var(--bg-subpanel)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>💡</div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest mb-0.5">Нужна помощь?</p>
              {!isQuiz && <p className="text-xs text-[var(--text-muted)] font-medium transition-colors duration-300">Разблокировать совет наставника</p>}
            </div>
          </div>
          <div className="px-5 py-2 bg-[var(--accent-primary)] text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity duration-300">
            20 XP
          </div>
        </button>
      ) : (
        <div className={`bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col transition-colors duration-300 ${isQuiz ? 'h-fit' : 'h-full'}`}>
          <div className="bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-4 h-10 flex items-center justify-between shrink-0 transition-colors duration-300">
            <h4 className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest">Совет наставника</h4>
            <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition-colors duration-300">Активен</span>
          </div>
          <div className={`p-6 prose prose-slate dark:prose-invert prose-sm max-w-none no-scrollbar transition-colors duration-300 ${isQuiz ? 'h-fit' : 'flex-1 overflow-y-auto'}`}>
            <MarkdownBlock content={stepData.hint} extraGlossary={lessonGlossary} />
          </div>
        </div>
      )}
    </div>
  );
};

export default function LessonModule({ lesson, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState('theory');
  const stepData = lesson.steps[currentStep];

  const { isLoading, runPython, interrupt } = usePyodide();
  const { xp, addXP, spendXP, unlockedTests } = useProgress();
  
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [dataFrame, setDataFrame] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); 
  const [completedSteps, setCompletedSteps] = useState([]);

  const isQuiz = stepData?.task?.type === 'quiz';
  const hasTask = !!stepData?.task;

  const currentHintKey = `${lesson.id}-step-${currentStep}_hint`;
  const isHintUnlocked = unlockedTests.includes(currentHintKey);

  useEffect(() => {
    const passed = lesson.steps
      .map((_, idx) => idx)
      .filter(idx => storage.isStepCompleted(lesson.id, idx));
    setCompletedSteps(passed);
  }, [lesson.id, lesson.steps]);

  useEffect(() => {
    const initialCode = stepData?.initialCode || "";
    const savedCode = storage.getLessonCode(`${lesson.id}-step-${currentStep}`, initialCode);
    setCode(savedCode);
    setOutput('');
    setPlots([]);
    setMetrics([]);
    setDataFrame(null);
    setTestStatus(null);
    setActiveTab('theory');
  }, [currentStep, lesson.id, stepData]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    storage.saveLessonCode(`${lesson.id}-step-${currentStep}`, newCode);
  };

  const handleReset = () => {
    if (window.confirm("Сбросить код к начальному состоянию?")) {
      const initialCode = stepData?.initialCode || "";
      setCode(initialCode);
      storage.clearLessonCode(`${lesson.id}-step-${currentStep}`);
      setOutput('');
      setPlots([]);
      setMetrics([]);
      setDataFrame(null);
      setTestStatus(null);
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]);
    setMetrics([]);
    setDataFrame(null);
    setTestStatus(null);
    
    const testsToRun = (withTests && stepData?.testCode) ? stepData.testCode : null;

    try {
      const { result, plots: newPlots, isDataFrame, testResults, dfData } = await runPython(
        code, 
        testsToRun, 
        (chunk) => setOutput(prev => prev + chunk),
        (metric) => setMetrics(prev => [...prev, metric])
      );
      
      let finalOutput = '';
      if (result !== undefined && !isDataFrame) {
        finalOutput += `\\n[Результат]: ${result}`;
      }

      if (isDataFrame && dfData) {
        setDataFrame(dfData);
      }

      setOutput(prev => {
        let newOut = prev + finalOutput;
        if (withTests && testResults) {
          newOut += testResults.output;
        }
        if (newOut.trim() === '') {
          return withTests ? '[Выполнение завершено]' : '[Код выполнен успешно]';
        }
        return newOut;
      });

      setPlots(newPlots || []);
      
      if (withTests) {
        if (testResults) {
          if (testResults.wasSuccessful) {
            setTestStatus('success');
            if (!storage.isStepCompleted(lesson.id, currentStep)) {
              addXP(10);
              storage.setStepCompleted(lesson.id, currentStep);
              setCompletedSteps(prev => [...prev, currentStep]);
            }
            if (currentStep === lesson.steps.length - 1) {
              storage.setLessonCompleted(lesson.id);
            }
          } else {
            setTestStatus('error');
          }
        } else {
          setTestStatus('success');
        }
      }
    } catch (err) {
      setTestStatus('error');
      setOutput(`[Ошибка выполнения]:\\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-app)] transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-[var(--border-main)] border-t-[var(--accent-primary)] rounded-full animate-spin mb-4"></div>
        <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest text-center">
          Initialising Python Engine<br/>
          <span className="font-normal normal-case opacity-60">Пожалуйста, подождите...</span>
        </p>
      </div>
    );
  }

  const getTaskContent = () => {
    if (!stepData?.task) return "";
    if (typeof stepData.task === 'string') return stepData.task;
    return stepData.task.content || "";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] transition-colors duration-300">
      {/* ПРЕМИУМ НАВБАР УРОКА */}
      <div className="flex items-center justify-between mb-6 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-3 shadow-sm shrink-0 transition-colors duration-300 relative overflow-hidden">
        {/* Декоративный градиентный фон для навбара */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-subpanel)] via-[var(--bg-card)] to-[var(--bg-subpanel)] opacity-50"></div>
        
        <div className="flex items-center gap-4 relative z-10 pl-2">
          <button onClick={onBack} className="group flex items-center gap-2 text-[10px] px-3 py-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:bg-[var(--border-main)] transition-all duration-300 font-bold uppercase tracking-widest active:scale-95">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Назад
          </button>
          <div className="h-6 w-px bg-[var(--border-main)] rounded-full"></div>
          <h1 className="text-base font-extrabold text-[var(--text-bright)] tracking-tight ml-2">{lesson.title}</h1>
        </div>
        
        <div className="flex items-center gap-6 relative z-10 pr-4">
          <div className="flex items-center gap-2">
            {lesson.steps.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentStep(idx)}
                className={`group relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300 ${idx === currentStep ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/20 scale-110' : completedSteps.includes(idx) ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-[var(--bg-subpanel)] text-[var(--text-muted)] hover:bg-[var(--border-main)]'}`}
              >
                <span className="text-[10px] font-black">{idx + 1}</span>
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-[var(--border-main)] rounded-full"></div>
          <div className="text-[10px] font-black text-[var(--accent-primary)] uppercase tracking-widest min-w-[70px] text-center tabular-nums bg-[var(--accent-primary)]/10 px-3 py-1.5 rounded-lg border border-[var(--accent-primary)]/20">
            {currentStep + 1} / {lesson.steps.length}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0 overflow-hidden items-stretch transition-colors duration-300">
        <div className="flex-1 flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm min-w-0 overflow-hidden h-full transition-colors duration-300">
           <div className="flex items-center justify-between bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-5 py-3 shrink-0 transition-colors duration-300">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm">
                 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
               </div>
               <span className="text-[12px] font-semibold text-[var(--text-bright)] uppercase tracking-widest">Материал урока</span>
             </div>
             {hasTask && !isQuiz && (
               <div className="flex bg-[var(--bg-card)] border border-[var(--border-main)] p-1 rounded-lg shadow-sm">
                 <button onClick={() => setActiveTab('theory')} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'theory' ? 'bg-[var(--bg-subpanel)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'}`}>Теория</button>
                 <button onClick={() => setActiveTab('task')} className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === 'task' ? 'bg-[var(--bg-subpanel)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent'}`}>Задание</button>
               </div>
             )}
           </div>
           <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[var(--bg-card)] transition-colors duration-300">
              <AnimatePresence mode="wait">
                {activeTab === 'theory' ? (
                  <motion.div key="theory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Шаг {currentStep + 1}</span>
                      <h2 className="text-2xl font-bold text-[var(--text-bright)] tracking-tight m-0 leading-none">Описание</h2>
                    </div>
                    <MarkdownBlock content={stepData?.theory} extraGlossary={lesson.glossary} />
                    {stepData?.type === 'regression' && <div className="my-8"><InteractiveRegression /></div>}
                    {stepData?.type === 'svm' && <div className="my-8"><SVMBoard /></div>}
                    {stepData?.type === 'gradient_descent' && <div className="my-8"><GradientDescentBoard /></div>}
                    {stepData?.type === 'jupyter' && <div className="my-8"><JupyterSandbox /></div>}
                  </motion.div>
                ) : (
                  <motion.div key="task" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">Шаг {currentStep + 1}</span>
                      <h2 className="text-2xl font-bold text-[var(--text-bright)] tracking-tight m-0 leading-none">Практическое задание</h2>
                    </div>
                    <div className="text-[var(--text-main)] text-sm leading-relaxed mb-10"><MarkdownBlock content={getTaskContent()} extraGlossary={lesson.glossary} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <div className="flex-[1.2] flex flex-col gap-4 min-w-0 overflow-hidden h-full transition-colors duration-300">
          {isQuiz ? (
            <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
               <div className="flex-1 flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] shadow-sm overflow-hidden min-h-0 transition-colors duration-300">
                  <div className="flex items-center justify-between bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-5 py-3 shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="overflow-visible"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-bright)] uppercase tracking-widest">Проверка знаний</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[var(--bg-card)] transition-colors duration-300">
                     <div className="max-w-2xl mx-auto prose prose-slate dark:prose-invert prose-sm flex flex-col min-h-full">
                       <div className="flex-1">
                         <QuizTask lessonId={lesson.id} stepIndex={currentStep} quiz={stepData.task} onSuccess={() => setCompletedSteps(prev => [...prev, currentStep])} />
                       </div>

                       {completedSteps.includes(currentStep) && currentStep < lesson.steps.length - 1 && (
                         <div className="mt-8 pt-8 border-t border-[var(--border-light)] shrink-0">
                           <button onClick={() => { setCurrentStep(s => s + 1); setActiveTab('theory'); }} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95">Перейти к следующему шагу</button>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
               <div className="shrink-0">
                 <HintBlock 
                    stepData={stepData} 
                    isHintUnlocked={isHintUnlocked} 
                    xp={xp} 
                    spendXP={spendXP} 
                    currentHintKey={currentHintKey} 
                    lessonGlossary={lesson.glossary} 
                    isQuiz={isQuiz}
                 />
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-5 h-full min-h-0">
              <div className="flex-[3] flex flex-col bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] overflow-hidden shadow-sm min-h-0 transition-all">
                 {/* Code Editor Header */}
                 <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-sm shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-bright)] uppercase tracking-widest">main.py</span>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={handleReset} className="px-4 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-card)] text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-bright)] hover:border-[var(--text-muted)] uppercase tracking-wider transition-all shadow-sm">Сброс</button>
                       <button onClick={() => executeCode(false)} disabled={isExecuting} className="px-4 py-1.5 rounded-lg border border-transparent bg-[var(--accent-primary)]/10 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white uppercase tracking-wider transition-all shadow-sm disabled:opacity-50">Запустить</button>
                    </div>
                 </div>
                 
                 <div className="flex-1 min-h-0 relative"><SandboxEditor code={code} onChange={handleCodeChange} /></div>
                 
                 <div className="flex items-center justify-between p-4 bg-[var(--bg-card)] border-t border-[var(--border-main)] shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-3 px-1">
                      {testStatus === 'success' && <span className="text-emerald-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>Верно</span>}
                      {testStatus === 'error' && <span className="text-rose-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>Ошибка</span>}
                    </div>
                    <div className="flex gap-3">
                       {(!isQuiz) && stepData?.testCode && (
                         <button onClick={() => executeCode(true)} disabled={isExecuting} className="px-6 py-2.5 bg-[var(--text-bright)] text-[var(--bg-app)] rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50"> {isExecuting ? 'Проверка...' : 'Проверить решение'}</button>
                       )}
                       {(testStatus === 'success' || completedSteps.includes(currentStep)) && currentStep < lesson.steps.length - 1 && (
                         <button onClick={() => { setCurrentStep(s => s + 1); setActiveTab('theory'); }} className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-95">Далее</button>
                       )}
                    </div>
                 </div>
              </div>

              {/* Terminal Header */}
              <div className="flex-[2] flex flex-col bg-[var(--bg-card)] rounded-t-2xl rounded-b-[16px] border border-[var(--border-main)] shadow-sm overflow-hidden min-h-0 transition-all">
                 <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--text-muted)]/10 flex items-center justify-center text-[var(--text-muted)] border border-[var(--text-muted)]/20 shadow-sm shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
                      </div>
                      <span className="text-[12px] font-semibold text-[var(--text-bright)] uppercase tracking-widest">Терминал</span>
                    </div>
                    {isExecuting && <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse shadow-[0_0_8px_var(--accent-primary)]"></div>}
                 </div>
                 
                 <div className="flex-1 overflow-hidden relative"><SandboxConsole output={output} testStatus={testStatus} /></div>
              </div>

              <div className="flex-[2] flex flex-col min-h-0 overflow-y-auto no-scrollbar pr-1 gap-4 h-full">
                <DataViewer data={dataFrame} />
                <SandboxPlots plots={plots} metrics={metrics} />
                <HintBlock 
                  stepData={stepData} 
                  isHintUnlocked={isHintUnlocked} 
                  xp={xp} 
                  spendXP={spendXP} 
                  currentHintKey={currentHintKey} 
                  lessonGlossary={lesson.glossary} 
                  isQuiz={isQuiz}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
