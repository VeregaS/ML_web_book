import { useState } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { useProgress } from '../context/ProgressContext';
import { storage } from '../utils/storage';
import { motion, AnimatePresence } from 'framer-motion';
import SandboxEditor from './Sandbox/SandboxEditor';
import SandboxControls from './Sandbox/SandboxControls';
import SandboxConsole from './Sandbox/SandboxConsole';
import SandboxPlots from './Sandbox/SandboxPlots';

export default function PythonSandbox({ lessonId, initialCode = "", testCode = null }) {
  const { isLoading, runPython, interrupt } = usePyodide();
  const { xp, addXP, spendXP, unlockedTests } = useProgress();
  
  const [code, setCode] = useState(() => storage.getLessonCode(lessonId, initialCode));
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [failedAssertDetails, setFailedAssertDetails] = useState('');

  const currentTestKey = `${lessonId}_failed_assert`;
  const isTestUnlocked = unlockedTests.includes(currentTestKey);

  const handleCodeChange = (value) => {
    setCode(value);
    storage.saveLessonCode(lessonId, value);
  };

  const handleReset = () => {
    if (window.confirm("Вы уверены, что хотите сбросить код до начального состояния? Все изменения будут потеряны.")) {
      setCode(initialCode);
      storage.clearLessonCode(lessonId);
      setOutput('');
      setPlots([]);
      setTestStatus(null);
      setFailedAssertDetails('');
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]);
    setTestStatus(null);
    setFailedAssertDetails('');
    
    const finalCode = withTests && testCode ? `${code}\n\n# --- СКРЫТЫЕ ТЕСТЫ ---\n${testCode}` : code;

    try {
      const { result, output: stdout, plots: newPlots } = await runPython(finalCode);
      
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
        addXP(10); // Начисляем 10 XP за успех
        storage.setLessonCompleted(lessonId);
      }
    } catch (err) {
      if (withTests && err.message.includes('AssertionError')) {
        setTestStatus('error');
        const lines = err.message.split('\n');
        const assertError = lines.find(line => line.includes('AssertionError')) || 'Тесты не пройдены.';
        
        setFailedAssertDetails(assertError); // Сохраняем детали ошибки для дебага
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
      <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-lg font-medium">
        ⏳ Инициализация среды Python...
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 flex flex-col">
      <SandboxEditor 
        code={code} 
        onChange={handleCodeChange} 
        onReset={handleReset} 
      />
      
      <SandboxControls 
        onExecute={executeCode} 
        onInterrupt={handleInterrupt}
        isExecuting={isExecuting}
        hasTestCode={!!testCode}
      />

      {/* Блок дебага скрытых тест-кейсов */}
      <AnimatePresence>
        {testStatus === 'error' && failedAssertDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            {!isTestUnlocked ? (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h4 className="text-slate-900 font-bold text-sm">Доступен расширенный дебаг-лог</h4>
                  <p className="text-slate-500 text-xs mt-1">Разблокируйте детали ошибки, чтобы понять, где именно код работает неверно.</p>
                </div>
                <button
                  onClick={() => spendXP(30, currentTestKey)}
                  disabled={xp < 30}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${
                    xp >= 30 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  🔓 Разблокировать (30 XP)
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1">Дебаг-инфо</span>
                  <pre className="p-4 bg-slate-900 text-rose-400 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                    {failedAssertDetails}
                  </pre>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {testStatus === 'success' && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg font-medium">
          🎉 Поздравляем! Все тесты пройдены успешно.
        </div>
      )}

      <SandboxConsole output={output} testStatus={testStatus} />

      <SandboxPlots plots={plots} />
    </div>
  );
}
