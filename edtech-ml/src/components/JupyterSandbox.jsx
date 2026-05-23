import { useState } from 'react';

export default function JupyterSandbox() {
  // Используем максимально простую версию без лишних параметров темы, которые могут блокироваться
  const notebookUrl = "https://jupyterlite.github.io/demo/repl/index.html?kernel=python&toolbar=1";
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="flex flex-col gap-4 h-[600px] my-8">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Интерактивный блокнот</h3>
          <p className="text-xs text-slate-500 mt-1">
            Пишите код и нажимайте <span className="font-mono bg-slate-100 px-1 rounded">Shift + Enter</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded border border-indigo-100">
          LIVE ENV
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Загрузка ядра...</p>
            </div>
          </div>
        )}
        
        <iframe 
          src={notebookUrl}
          width="100%"
          height="100%"
          title="JupyterLite"
          className="border-none"
          onLoad={() => setIsLoading(false)}
          // Убрали sandbox для обхода блокировок встраивания
        />
      </div>
    </div>
  );
}
