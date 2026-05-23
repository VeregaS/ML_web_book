import { useState } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { useProgress } from '../context/ProgressContext';
import { storage } from '../utils/storage';
import SandboxEditor from './Sandbox/SandboxEditor';
import SandboxControls from './Sandbox/SandboxControls';
import SandboxConsole from './Sandbox/SandboxConsole';
import SandboxPlots from './Sandbox/SandboxPlots';
import DataViewer from './Sandbox/DataViewer';
import LiveMetrics from './Sandbox/LiveMetrics';

export default function PythonSandbox({ lessonId, initialCode = "", testCode = null }) {
  const { isLoading, runPython, interrupt } = usePyodide();
  const { addXP } = useProgress();
  
  const [code, setCode] = useState(() => storage.getLessonCode(lessonId, initialCode));
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [dfData, setDfData] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [failedAssertDetails, setFailedAssertDetails] = useState('');

  const handleCodeChange = (value) => {
    setCode(value);
    storage.saveLessonCode(lessonId, value);
  };

  const handleReset = () => {
    if (window.confirm("Сбросить код к начальному состоянию?")) {
      setCode(initialCode);
      storage.clearLessonCode(lessonId);
      setOutput('');
      setPlots([]);
      setMetrics([]);
      setDfData(null);
      setTestStatus(null);
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]);
    setMetrics([]);
    setDfData(null);
    setTestStatus(null);
    setFailedAssertDetails('');
    
    try {
      const { result, plots: newPlots, isDataFrame, testResults, dfData: newDfData } = await runPython(
        code, 
        withTests ? testCode : null,
        (chunk) => setOutput(prev => prev + chunk), // Стриминг вывода
        (metric) => setMetrics(prev => [...prev, metric]) // Стриминг метрик
      );
      
      if (isDataFrame && newDfData) {
        setDfData(newDfData);
      }

      setPlots(newPlots || []);
      
      if (withTests && testResults) {
        if (testResults.wasSuccessful) {
          setTestStatus('success');
          addXP(10);
          storage.setLessonCompleted(lessonId);
        } else {
          setTestStatus('error');
          // Формируем детальный отчет об ошибках
          const details = [
            ...testResults.failures,
            ...testResults.errors
          ].join('\n');
          setFailedAssertDetails(details);
          setOutput(prev => prev + `\n\n[ОШИБКА ТЕСТОВ]:\n${details}`);
        }
      } else {
        setTestStatus(null);
      }
    } catch (err) {
      setTestStatus('error');
      setOutput(prev => prev + `\n[Ошибка выполнения]:\n${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInterrupt = () => {
    interrupt();
    setIsExecuting(false);
    setOutput(prev => prev + '\n[Прервано]: Процесс остановлен.');
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400">
        ⏳ Загрузка Python...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 flex flex-col">
      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <SandboxEditor 
          code={code} 
          onChange={handleCodeChange} 
        />
        <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center">
          <SandboxControls 
            onExecute={executeCode} 
            onInterrupt={handleInterrupt}
            isExecuting={isExecuting}
            hasTestCode={!!testCode}
          />
        </div>
      </div>

      {/* Инспектор данных */}
      {dfData && <DataViewer data={dfData} />}

      {/* Метрики обучения */}
      {metrics.length > 0 && <LiveMetrics metrics={metrics} />}

      {/* Статус тестов */}
      {testStatus === 'success' && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-emerald-800 text-xs font-bold">
          Задание выполнено верно! +10 XP
        </div>
      )}

      {/* Консоль */}
      <div className="h-64 bg-[#0d1117] rounded-lg overflow-hidden border border-slate-800 shadow-xl">
        <SandboxConsole output={output} testStatus={testStatus} />
      </div>

      {/* Математические графики */}
      <SandboxPlots plots={plots} />
    </div>
  );
}
