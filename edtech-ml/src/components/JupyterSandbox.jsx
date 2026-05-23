import { useState } from 'react';

export default function JupyterSandbox() {
  // Используем режим 'repl', он максимально чистый и содержит только ячейки и их вывод.
  // Тема JupyterLab Light лучше вписывается в наш дизайн.
  const notebookUrl = "https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1&theme=JupyterLab%20Light";
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col gap-4 h-[600px] my-8">
      {/* Шапка блока с инструкциями */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Интерактивный блокнот</h3>
          <p className="text-sm text-slate-500">
            Пишите код и нажимайте <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">Shift + Enter</span> для выполнения.
          </p>
        </div>
        
        {/* Индикатор статуса */}
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Live Environment
        </div>
      </div>
      
      {/* Контейнер для iframe */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-inner relative">
        {/* Анимированный лоадер, который виден пока iframe не загрузится */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-medium animate-pulse">Запуск ядра Python...</p>
            </div>
          </div>
        )}
        
        <iframe 
          src={notebookUrl}
          width="100%"
          height="100%"
          title="JupyterLite REPL"
          className="border-none"
          onLoad={() => setIsLoading(false)}
          /* sandbox добавлен для безопасности, но разрешает выполнение необходимых скриптов */
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
