const SandboxConsole = ({ output, testStatus }) => {
  const isError = testStatus === 'error';
  
  return (
    <div className={`p-4 rounded-lg min-h-[120px] font-mono text-base border shadow-inner overflow-x-auto whitespace-pre-wrap ${
      isError ? 'bg-red-950 text-red-400 border-red-800' : 'bg-[#0d1117] text-emerald-400 border-slate-800'
    }`}>
      {output || '>> Ожидание выполнения...'}
    </div>
  );
};

export default SandboxConsole;
