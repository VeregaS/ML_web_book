import React, { useState } from 'react';

/**
 * Профессиональный компонент для отрисовки графиков.
 * Полностью адаптивный, без жестких рамок, с улучшенной читаемостью.
 */
export default function ChartBlock({ content, hideTitle = false }) {
  const [activeDataset, setActiveDataset] = useState(0); 
  const [hoveredPoint, setHoveredPoint] = useState(null);

  let config;
  try {
    config = JSON.parse(content);
  } catch (e) {
    return <pre className="text-red-500 text-xs p-4 bg-red-50 rounded-xl font-mono">Ошибка формата графика: {e.message}</pre>;
  }

  const { 
    type = 'line', 
    datasets = [], 
    title = '', 
    xLabel = '', 
    yLabel = '',
    showOrigin = false,
  } = config;

  const processedDatasets = datasets.length > 0 
    ? datasets 
    : (config.data ? [{ label: 'Data', data: config.data, type: config.type || type }] : []);

  if (processedDatasets.length === 0) return null;

  // Адаптивные параметры
  const width = 600;
  const height = 350;
  const padding = 60;

  const allPoints = processedDatasets.flatMap(ds => ds.data);
  const xValues = allPoints.map(d => d.x);
  const yValues = allPoints.map(d => d.y);
  
  const minX = Math.min(0, Math.min(...xValues));
  const maxX = Math.max(0, Math.max(...xValues));
  const minY = Math.min(0, Math.min(...yValues));
  const maxY = Math.max(0, Math.max(...yValues));

  const rangeX = (maxX - minX) || 1;
  const rangeY = (maxY - minY) || 1;

  const getX = (x) => padding + ((x - minX) / rangeX) * (width - padding * 2);
  const getY = (y) => height - padding - ((y - minY) / rangeY) * (height - padding * 2);

  const renderDataset = (ds, index) => {
    const isVisible = activeDataset === 0 || activeDataset === (index + 1);
    if (!isVisible) return null;

    const dsType = ds.type || type;
    const color = ds.color || (index === 0 ? '#6366f1' : index === 1 ? '#ec4899' : '#10b981');
    const pointsStr = ds.data.map(d => `${getX(d.x)},${getY(d.y)}`).join(' ');

    return (
      <g key={index} className="transition-opacity duration-300">
        {showOrigin && ds.data.map((d, i) => (
          <line 
            key={`vec-${i}`}
            x1={getX(0)} y1={getY(0)}
            x2={getX(d.x)} y2={getY(d.y)}
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray="6 3"
            opacity="0.5"
          />
        ))}

        {dsType === 'line' && (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsStr}
            className="drop-shadow-md"
          />
        )}

        {ds.data.map((d, i) => (
          <g 
            key={i} 
            onMouseEnter={() => setHoveredPoint({ ...d, label: ds.label, color })}
            onMouseLeave={() => setHoveredPoint(null)}
            className="cursor-pointer"
          >
            <circle 
              cx={getX(d.x)} 
              cy={getY(d.y)} 
              r={dsType === 'scatter' ? 7 : 5} 
              fill={dsType === 'scatter' ? color : "white"} 
              stroke={color}
              strokeWidth="3"
              className="hover:r-9 transition-all"
            />
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className={`${hideTitle ? 'my-8' : 'my-16'} w-full animate-in fade-in slide-in-from-bottom-6 duration-700`}>
      {title && !hideTitle && (
        <div className="w-full flex justify-center mb-10 px-4">
          <h5 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-900 text-center border-b-2 border-indigo-500/20 pb-4 leading-relaxed">
            {title}
          </h5>
        </div>
      )}
      
      {/* Контейнер БЕЗ overflow-hidden, чтобы тултипы могли свободно выходить за границы */}
      <div className="w-full bg-slate-50/50 rounded-[3rem] p-6 md:p-12 border border-slate-200/50 shadow-inner relative group isolation-auto">
        <div className="relative">
          <svg 
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto block overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Сетка */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => {
                 const y = padding + v * (height - padding * 2);
                 const x = padding + v * (width - padding * 2);
                 return (
                   <g key={v}>
                     <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
                     <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
                   </g>
                 );
            })}

            {/* Оси */}
            <line x1={getX(minX)} y1={getY(0)} x2={getX(maxX)} y2={getY(0)} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1={getX(0)} y1={getY(minY)} x2={getX(0)} y2={getY(maxY)} stroke="#475569" strokeWidth="3" strokeLinecap="round" />

            {/* Названия осей */}
            <text x={getX(maxX) + 15} y={getY(0)} fontSize="12" fill="#64748b" fontWeight="900" dominantBaseline="middle" className="uppercase tracking-widest">{xLabel || 'X'}</text>
            <text x={getX(0)} y={getY(maxY) - 20} fontSize="12" fill="#64748b" fontWeight="900" textAnchor="middle" className="uppercase tracking-widest">{yLabel || 'Y'}</text>

            {/* Подписи осей */}
            <text x={getX(minX)} y={getY(0) + 30} fontSize="13" fill="#1e293b" textAnchor="middle" fontWeight="800">{minX.toFixed(1)}</text>
            <text x={getX(maxX)} y={getY(0) + 30} fontSize="13" fill="#1e293b" textAnchor="middle" fontWeight="800">{maxX.toFixed(1)}</text>
            <text x={getX(0) - 25} y={getY(minY)} fontSize="13" fill="#1e293b" textAnchor="end" dominantBaseline="middle" fontWeight="800">{minY.toFixed(1)}</text>
            <text x={getX(0) - 25} y={getY(maxY)} fontSize="13" fill="#1e293b" textAnchor="end" dominantBaseline="middle" fontWeight="800">{maxY.toFixed(1)}</text>

            {/* Данные */}
            {processedDatasets.map((ds, i) => renderDataset(ds, i))}
          </svg>

          {/* HTML-тултип с защитой от выхода за края экрана */}
          {hoveredPoint && (
            <div 
              className="absolute pointer-events-none z-[100] transition-all duration-200 ease-out"
              style={{ 
                left: `${(getX(hoveredPoint.x) / width) * 100}%`,
                top: `${(getY(hoveredPoint.y) / height) * 100}%`,
                // Умный сдвиг: 
                // Если точка в правой трети — тултип слева. 
                // Если в левой трети — тултип справа. 
                // Если в центре — тултип центрируется над точкой.
                transform: `translate(${
                  hoveredPoint.x > maxX * 0.7 ? '-100%' : 
                  hoveredPoint.x < minX + rangeX * 0.3 ? '0%' : '-50%'
                }, ${getY(hoveredPoint.y) < padding * 2 ? '20%' : '-120%'})`,
                marginLeft: hoveredPoint.x > maxX * 0.7 ? '-15px' : hoveredPoint.x < minX + rangeX * 0.3 ? '15px' : '0'
              }}
            >
              <div 
                className="bg-white px-5 py-4 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 whitespace-nowrap min-w-[140px]"
                style={{ borderColor: hoveredPoint.color }}
              >
                <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-2">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: hoveredPoint.color }}></div>
                  <div className="text-[13px] font-black text-slate-900 leading-none">{hoveredPoint.label}</div>
                </div>
                <div className="text-[11px] font-bold text-slate-500 font-mono flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5"><span className="text-slate-300 font-black">X</span> {hoveredPoint.x.toFixed(2)}</span>
                  <span className="text-slate-100">|</span>
                  <span className="flex items-center gap-1.5"><span className="text-slate-300 font-black">Y</span> {hoveredPoint.y.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Контролы внизу для удобства */}
      <div className="mt-8 flex flex-col items-center gap-6">
        {processedDatasets.length > 1 && (
          <div className="flex flex-wrap justify-center bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveDataset(0)}
              className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeDataset === 0 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
            >Все</button>
            {processedDatasets.map((ds, i) => (
              <button 
                key={i}
                onClick={() => setActiveDataset(i + 1)}
                className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeDataset === (i + 1) ? 'shadow-md shadow-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                style={{ 
                  backgroundColor: activeDataset === (i + 1) ? ds.color || '#6366f1' : 'transparent',
                  color: activeDataset === (i + 1) ? 'white' : undefined 
                }}
              >
                {ds.label}
              </button>
            ))}
          </div>
        )}

        {/* Легенда (бывшие информационные метки) */}
        <div className="flex flex-wrap justify-center gap-8 px-4">
           {processedDatasets.map((ds, i) => (
             <div key={i} className={`flex items-center gap-3 transition-opacity ${activeDataset !== 0 && activeDataset !== (i + 1) ? 'opacity-20' : 'opacity-100'}`}>
               <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ds.color || '#6366f1' }}></div>
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">{ds.label}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
