const SandboxConsole = ({ output, testStatus }) => {
  const isError = testStatus === 'error';
  
  return (
    <div className={`p-4 rounded-lg h-full font-mono text-sm border shadow-inner overflow-y-auto overflow-x-auto whitespace-pre-wrap transition-colors duration-300 scrollbar-thin ${
      isError 
        ? 'bg-red-950 text-red-400 border-red-800 selection:bg-red-800/30' 
        : 'bg-[#0d1117] text-emerald-400 border-slate-800 selection:bg-emerald-900/30'
    }`}>
      <span className="opacity-50 select-none mr-2">{'>>'}</span>
      {output || 'Ожидание выполнения...'}
    </div>
  );
};

export default SandboxConsole;
