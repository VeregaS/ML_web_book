const SandboxPlots = ({ plots }) => {
  if (!plots || plots.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center gap-6">
      <h3 className="text-slate-500 font-semibold uppercase tracking-wider text-sm self-start">
        Сгенерированные графики
      </h3>
      {plots.map((base64_str, idx) => (
        <img 
          key={idx} 
          src={`data:image/png;base64,${base64_str}`} 
          alt={`График ${idx + 1}`} 
          className="max-w-full h-auto border border-slate-100 shadow-sm"
        />
      ))}
    </div>
  );
};

export default SandboxPlots;
