import React from 'react';

/**
 * Простой компонент для отрисовки графиков внутри Markdown.
 * Позволяет ИИ (NotebookLM) генерировать визуализации данных через JSON.
 */
export default function ChartBlock({ content }) {
  let config;
  try {
    config = JSON.parse(content);
  } catch (e) {
    return <pre className="text-red-500 text-xs p-4 bg-red-50 rounded-xl">Ошибка формата графика: {e.message}</pre>;
  }

  const { type = 'line', data = [], title = '', xLabel = '', yLabel = '' } = config;

  if (!data || data.length === 0) return null;

  const width = 450;
  const height = 220;
  const padding = 40;

  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(0, Math.min(...yValues));
  const maxY = Math.max(...yValues);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const getX = (x) => padding + ((x - minX) / rangeX) * (width - padding * 2);
  const getY = (y) => height - padding - ((y - minY) / rangeY) * (height - padding * 2);

  const pointsStr = data.map(d => `${getX(d.x)},${getY(d.y)}`).join(' ');

  return (
    <div className="my-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
      {title && (
        <h5 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">
          {title}
        </h5>
      )}
      
      <div className="overflow-x-auto custom-scrollbar">
        <svg 
          width={width} 
          height={height} 
          className="mx-auto block overflow-visible text-indigo-500"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Сетка и оси */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#f1f5f9" strokeWidth="2" />

          {/* Подписи осей */}
          <text x={padding} y={height - padding + 20} fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="bold">{minX.toFixed(1)}</text>
          <text x={width - padding} y={height - padding + 20} fontSize="10" fill="#94a3b8" textAnchor="middle" fontWeight="bold">{maxX.toFixed(1)}</text>
          <text x={padding - 12} y={height - padding} fontSize="10" fill="#94a3b8" textAnchor="end" dominantBaseline="middle" fontWeight="bold">{minY.toFixed(1)}</text>
          <text x={padding - 12} y={padding} fontSize="10" fill="#94a3b8" textAnchor="end" dominantBaseline="middle" fontWeight="bold">{maxY.toFixed(1)}</text>

          {/* Линия (если тип line) */}
          {type === 'line' && (
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={pointsStr}
              className="drop-shadow-[0_2px_4px_rgba(99,102,241,0.2)]"
            />
          )}

          {/* Точки */}
          {data.map((d, i) => (
            <circle 
              key={i} 
              cx={getX(d.x)} 
              cy={getY(d.y)} 
              r={type === 'scatter' ? 5 : 3.5} 
              fill={type === 'scatter' ? "rgba(99,102,241,0.5)" : "white"} 
              stroke="currentColor"
              strokeWidth="2.5"
              className="hover:r-6 transition-all cursor-crosshair"
            >
              <title>x: {d.x}, y: {d.y}</title>
            </circle>
          ))}
        </svg>
      </div>
      
      {(xLabel || yLabel) && (
        <div className="flex justify-center gap-8 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {xLabel && <div className="flex items-center gap-2"><div className="w-2 h-0.5 bg-slate-300"></div> X: {xLabel}</div>}
          {yLabel && <div className="flex items-center gap-2"><div className="w-2 h-2 border-2 border-slate-300 rounded-full"></div> Y: {yLabel}</div>}
        </div>
      )}
    </div>
  );
}
