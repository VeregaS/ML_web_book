import { useState } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import { storage } from '../utils/storage';
import SandboxEditor from './Sandbox/SandboxEditor';
import SandboxControls from './Sandbox/SandboxControls';
import SandboxConsole from './Sandbox/SandboxConsole';
import SandboxPlots from './Sandbox/SandboxPlots';

export default function PythonSandbox({ lessonId, initialCode = "", testCode = null }) {
  const { isLoading, runPython, interrupt } = usePyodide();
  
  const [code, setCode] = useState(() => storage.getLessonCode(lessonId, initialCode));
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

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
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]);
    setTestStatus(null);
    
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
        storage.setLessonCompleted(lessonId);
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
