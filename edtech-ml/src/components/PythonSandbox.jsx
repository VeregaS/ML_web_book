import { useState } from 'react';
import { usePyodide } from '../hooks/usePyodide';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';

export default function PythonSandbox({ lessonId, initialCode = "", testCode = null }) {
  const { isLoading, runPython, interrupt } = usePyodide();
  
  // Ленивая инициализация: проверяем кэш при первом рендере
  const [code, setCode] = useState(() => {
    if (!lessonId) return initialCode;
    const savedCode = localStorage.getItem(`ml-lesson-${lessonId}`);
    return savedCode !== null ? savedCode : initialCode;
  });
  
  const [output, setOutput] = useState('');
  const [plots, setPlots] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  // Обработчик изменения кода: сохраняем в стейт и в localStorage
  const handleCodeChange = (value) => {
    setCode(value);
    if (lessonId) {
      localStorage.setItem(`ml-lesson-${lessonId}`, value);
    }
  };

  // Функция сброса к исходному состоянию
  const handleReset = () => {
    if (window.confirm("Вы уверены, что хотите сбросить код до начального состояния? Все изменения будут потеряны.")) {
      setCode(initialCode);
      if (lessonId) localStorage.removeItem(`ml-lesson-${lessonId}`);
      setOutput('');
      setPlots([]); // Сброс графиков
      setTestStatus(null);
    }
  };

  const executeCode = async (withTests = false) => {
    setIsExecuting(true);
    setOutput('');
    setPlots([]); // Очистка старых графиков
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
      setPlots(newPlots || []); // Сохранение новых графиков
      
      if (withTests) {
        setTestStatus('success');
        const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
        if (!completed.includes(lessonId)) {
          completed.push(lessonId);
          localStorage.setItem('completedLessons', JSON.stringify(completed));
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

  return (
    <div className="w-full space-y-4">
      {isLoading ? (
        <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-lg font-medium">
          ⏳ Инициализация среды Python...
        </div>
      ) : (
        <div className="space-y-3 flex flex-col">
          
          <div className="rounded-lg overflow-hidden border border-slate-700 shadow-inner">
             <div className="bg-slate-800 text-slate-400 text-xs px-4 py-1.5 font-mono border-b border-slate-700 flex justify-between items-center">
              <span>main.py</span>
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-white transition-colors"
                title="Сбросить код к начальному состоянию"
              >
                ⟲ Сбросить
              </button>
            </div>
            <CodeMirror
              value={code}
              height="300px"
              theme="dark"
              extensions={[python()]}
              onChange={handleCodeChange}
              className="text-sm sm:text-base font-mono"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true,
              }}
            />
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={() => executeCode(false)}
              disabled={isExecuting}
              className="px-6 py-3 bg-slate-600 text-white text-lg font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              ▶ Run
            </button>
            
            {testCode && (
              <button
                onClick={() => executeCode(true)}
                disabled={isExecuting}
                className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isExecuting ? 'Выполнение...' : '✔ Проверить решение'}
              </button>
            )}

            {isExecuting && (
              <button
                onClick={handleInterrupt}
                className="px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-pulse"
              >
                ⏹ Очистить память (Stop)
              </button>
            )}
          </div>

          {testStatus === 'success' && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg font-medium">
              🎉 Поздравляем! Все тесты пройдены успешно.
            </div>
          )}

          <div className={`p-4 rounded-lg min-h-[120px] font-mono text-base border shadow-inner overflow-x-auto whitespace-pre-wrap ${
            testStatus === 'error' ? 'bg-red-950 text-red-400 border-red-800' : 'bg-[#0d1117] text-emerald-400 border-slate-800'
          }`}>
            {output || '>> Ожидание выполнения...'}
          </div>

          {/* Контейнер для сгенерированных графиков */}
          {plots.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center gap-6">
              <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-sm self-start">Сгенерированные графики</h3>
              {plots.map((base64_str, idx) => (
                <img 
                  key={idx} 
                  src={`data:image/png;base64,${base64_str}`} 
                  alt={`График ${idx + 1}`} 
                  className="max-w-full h-auto border border-slate-100 shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}