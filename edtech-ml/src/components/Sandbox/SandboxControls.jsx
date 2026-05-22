const SandboxControls = ({ onExecute, onCheck, onInterrupt, isExecuting, hasTestCode }) => (
  <div className="flex gap-4 items-center flex-wrap">
    <button
      onClick={() => onExecute(false)}
      disabled={isExecuting}
      className="px-6 py-3 bg-slate-600 text-white text-lg font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors shadow-sm"
    >
      ▶ Run
    </button>
    
    {hasTestCode && (
      <button
        onClick={() => onExecute(true)}
        disabled={isExecuting}
        className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
      >
        {isExecuting ? 'Выполнение...' : '✔ Проверить решение'}
      </button>
    )}

    {isExecuting && (
      <button
        onClick={onInterrupt}
        className="px-6 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm animate-pulse"
      >
        ⏹ Очистить память (Stop)
      </button>
    )}
  </div>
);

export default SandboxControls;
