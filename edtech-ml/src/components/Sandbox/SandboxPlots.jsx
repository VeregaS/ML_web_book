import React from 'react';

const SandboxPlots = ({ plots, metrics }) => {
  const hasPlots = plots && plots.length > 0;
  const hasMetrics = metrics && metrics.length > 0;

  if (!hasPlots && !hasMetrics) return null;

  // Простая SVG-визуализация метрик (Live Loss)
  const renderMetrics = () => {
    if (!hasMetrics) return null;

    // Нормализация координат для SVG
    const width = 400;
    const height = 150;
    const padding = 20;

    const maxEpoch = Math.max(...metrics.map(m => m.epoch));
    const maxLoss = Math.max(...metrics.map(m => m.loss));
    const minLoss = Math.min(0, Math.min(...metrics.map(m => m.loss)));

    const getX = (epoch) => padding + ((epoch) / (maxEpoch || 1)) * (width - padding * 2);
    const getY = (loss) => height - padding - ((loss - minLoss) / ((maxLoss - minLoss) || 1)) * (height - padding * 2);

    const points = metrics.map(m => `${getX(m.epoch)},${getY(m.loss)}`).join(' ');

    return (
      <div className="w-full">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Динамика обучения (Loss)</h4>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 overflow-x-auto">
          <svg width={width} height={height} className="overflow-visible text-indigo-500 mx-auto block min-w-[300px]">
            {/* Оси */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Линия */}
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={points}
              strokeLinejoin="round"
            />
            
            {/* Точки */}
            {metrics.map((m, i) => (
              <circle key={i} cx={getX(m.epoch)} cy={getY(m.loss)} r="3" fill="currentColor" />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center gap-6 mt-4">
      {renderMetrics()}

      {hasPlots && (
        <div className="w-full">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Графики (Matplotlib)</h4>
          <div className="flex flex-col gap-4 items-center">
            {plots.map((base64_str, idx) => (
              <img 
                key={idx} 
                src={`data:image/png;base64,${base64_str}`} 
                alt={`График ${idx + 1}`} 
                className="max-w-full h-auto border border-slate-100 shadow-sm rounded-lg"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SandboxPlots;
