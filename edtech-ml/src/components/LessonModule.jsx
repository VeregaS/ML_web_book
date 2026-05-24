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
          className={`w-full h-full flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg hover:border-indigo-500 transition-colors duration-300 group shadow-sm active:scale-[0.98] ${isQuiz ? 'px-4 py-2' : 'p-6'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`${isQuiz ? 'w-8 h-8 text-base' : 'w-10 h-10 text-xl'} bg-[var(--bg-subpanel)] rounded flex items-center justify-center group-hover:scale-110 transition-transform`}>💡</div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest mb-0.5">Нужна помощь?</p>
              {!isQuiz && <p className="text-xs text-[var(--text-muted)] font-medium transition-colors duration-300">Разблокировать совет наставника</p>}
            </div>
          </div>
          <div className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-colors duration-300">
            20 XP
          </div>
        </button>
      ) : (
        <div className={`bg-[var(--bg-card)] border border-[var(--border-main)] rounded-lg shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col transition-colors duration-300 ${isQuiz ? 'h-fit' : 'h-full'}`}>
          <div className="bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-4 h-10 flex items-center justify-between shrink-0 transition-colors duration-300">
            <h4 className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest">Совет наставника</h4>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors duration-300">Активен</span>
          </div>
          <div className={`p-6 prose prose-slate dark:prose-invert prose-sm max-w-none custom-scrollbar transition-colors duration-300 ${isQuiz ? 'h-fit' : 'flex-1 overflow-y-auto'}`}>
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
        <div className="w-8 h-8 border-2 border-[var(--border-main)] border-t-indigo-600 rounded-full animate-spin mb-4"></div>
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
      <div className="flex items-center justify-between mb-4 bg-[var(--bg-subpanel)] border border-[var(--border-main)] rounded-lg p-2 shadow-sm shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-[10px] px-2.5 py-1.5 border border-[var(--border-main)] rounded-md text-[var(--text-bright)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-bold uppercase tracking-wider bg-[var(--bg-card)] shadow-sm active:scale-95">Выход</button>
          <div className="h-4 w-px bg-[var(--border-main)]"></div>
          <h1 className="text-sm font-bold text-[var(--text-bright)] truncate max-w-[200px] tracking-tight">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-app)] p-1 rounded-md border border-[var(--border-light)] transition-colors duration-300">
          {lesson.steps.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentStep(idx)}
              className={`group relative flex items-center justify-center w-8 h-6 rounded transition-all duration-300 ${idx === currentStep ? 'bg-indigo-600 text-white shadow-sm' : completedSteps.includes(idx) ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30' : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-subpanel)]'}`}
            >
              <span className="text-[10px] font-black">{idx + 1}</span>
              {completedSteps.includes(idx) && idx !== currentStep && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[var(--bg-app)]"></div>}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end px-2 min-w-[70px]">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest tabular-nums leading-none">
            {currentStep + 1} / {lesson.steps.length}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden items-stretch transition-colors duration-300">
        <div className="flex-1 flex flex-col bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] shadow-sm min-w-0 overflow-hidden h-full transition-colors duration-300">
           <div className="flex items-center bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-2 h-10 shrink-0 transition-colors duration-300">
              <button onClick={() => setActiveTab('theory')}
                className={`px-5 h-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${activeTab === 'theory' ? 'border-indigo-600 text-[var(--text-bright)] bg-[var(--bg-card)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >Описание</button>
              {hasTask && !isQuiz && (
                <button onClick={() => setActiveTab('task')}
                  className={`px-5 h-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border-b-2 ${activeTab === 'task' ? 'border-indigo-600 text-[var(--text-bright)] bg-[var(--bg-card)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >Задание</button>
              )}
           </div>
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[var(--bg-card)] transition-colors duration-300">
              <AnimatePresence mode="wait">
                {activeTab === 'theory' ? (
                  <motion.div key="theory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                    <h2 className="text-xl font-bold text-[var(--text-bright)] mb-6 tracking-tight">Шаг {currentStep + 1}: Описание</h2>
                    <MarkdownBlock content={stepData?.theory} extraGlossary={lesson.glossary} />
                    {stepData?.type === 'regression' && <div className="my-8"><InteractiveRegression /></div>}
                    {stepData?.type === 'svm' && <div className="my-8"><SVMBoard /></div>}
                    {stepData?.type === 'gradient_descent' && <div className="my-8"><GradientDescentBoard /></div>}
                    {stepData?.type === 'jupyter' && <div className="my-8"><JupyterSandbox /></div>}
                  </motion.div>
                ) : (
                  <motion.div key="task" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                    <h2 className="text-xl font-bold text-[var(--text-bright)] mb-6 tracking-tight">Практическое задание</h2>
                    <div className="text-[var(--text-main)] text-sm leading-relaxed mb-10"><MarkdownBlock content={getTaskContent()} extraGlossary={lesson.glossary} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>

        <div className="flex-[1.2] flex flex-col gap-4 min-w-0 overflow-hidden h-full transition-colors duration-300">
          {isQuiz ? (
            <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
               <div className="flex-1 flex flex-col bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] shadow-sm overflow-hidden min-h-0 transition-colors duration-300">
                  <div className="flex items-center bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] px-4 h-10 shrink-0 transition-colors duration-300">
                    <span className="text-[11px] font-bold text-[var(--text-bright)] uppercase tracking-widest">Проверка знаний</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[var(--bg-card)] transition-colors duration-300">
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
            <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
              <div className="flex-[3] flex flex-col bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] overflow-hidden shadow-sm min-h-0 transition-all">
                 <div className="flex items-center justify-between px-4 h-10 bg-[var(--bg-subpanel)] border-b border-[var(--border-main)] shrink-0">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">main.py</span>
                    <div className="flex gap-4">
                       <button onClick={handleReset} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-bright)] uppercase tracking-wider transition-colors">Сброс</button>
                       <button onClick={() => executeCode(false)} disabled={isExecuting} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors">Запустить</button>
                    </div>
                 </div>
                 <div className="flex-1 min-h-0 relative"><SandboxEditor code={code} onChange={handleCodeChange} /></div>
                 <div className="flex items-center justify-between p-3 bg-[var(--bg-subpanel)] border-t border-[var(--border-main)] shrink-0">
                    <div className="flex items-center gap-3 px-1">
                      {testStatus === 'success' && <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>Верно</span>}
                      {testStatus === 'error' && <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full"></div>Ошибка</span>}
                    </div>
                    <div className="flex gap-2">
                       {(!isQuiz) && stepData?.testCode && (
                         <button onClick={() => executeCode(true)} disabled={isExecuting} className="px-6 py-2 bg-[var(--bg-app)] text-[var(--text-bright)] rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--bg-card)] transition-all shadow-sm active:scale-95 disabled:opacity-50"> {isExecuting ? 'Проверка...' : 'Проверить решение'}</button>
                       )}
                       {(testStatus === 'success' || completedSteps.includes(currentStep)) && currentStep < lesson.steps.length - 1 && (
                         <button onClick={() => { setCurrentStep(s => s + 1); setActiveTab('theory'); }} className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-md active:scale-95">Далее</button>
                       )}
                    </div>
                 </div>
              </div>

              <div className="flex-[2] flex flex-col bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] shadow-sm overflow-hidden min-h-0 transition-all">
                 <div className="px-4 py-2 border-b border-[var(--border-main)] bg-[var(--bg-subpanel)] flex justify-between items-center shrink-0">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Терминал</span>
                    {isExecuting && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>}
                 </div>
                 <div className="flex-1 overflow-hidden"><SandboxConsole output={output} testStatus={testStatus} /></div>
              </div>

              <div className="flex-[2] flex flex-col min-h-0 overflow-y-auto custom-scrollbar pr-1 gap-4 h-full">
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
