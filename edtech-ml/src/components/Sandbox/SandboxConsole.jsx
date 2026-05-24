const SandboxConsole = ({ output, testStatus }) => {
  const isError = testStatus === 'error';
  
  return (
    <div className={`p-4 rounded-b-[14px] rounded-t-none h-full font-mono text-sm border shadow-inner overflow-y-auto overflow-x-auto whitespace-pre-wrap transition-colors duration-300 scrollbar-thin ${
      isError 
        ? 'bg-rose-500/5 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 selection:bg-rose-500/30' 
        : 'bg-[var(--bg-app)] text-[var(--text-main)] border-[var(--border-main)] selection:bg-[var(--accent-primary)]/30'
    }`}>
      <span className="text-[var(--text-muted)] select-none mr-2">{'>>'}</span>
      <span className={isError ? "" : "text-[var(--text-bright)]"}>{output || 'Ожидание выполнения...'}</span>
    </div>
  );
};

export default SandboxConsole;
