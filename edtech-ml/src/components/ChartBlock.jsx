import React, { useState } from 'react';

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
            strokeWidth="2"
            strokeDasharray="4 2"
            opacity="0.4"
          />
        ))}

        {dsType === 'line' && (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={pointsStr}
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
              r={dsType === 'scatter' ? 6 : 4} 
              fill={dsType === 'scatter' ? color : "var(--bg-card)"} 
              stroke={color}
              strokeWidth="2.5"
              className="hover:r-8 transition-all"
            />
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className={`${hideTitle ? 'my-8' : 'my-16'} w-full animate-in fade-in duration-700 transition-all`}>
      {title && !hideTitle && (
        <div className="w-full flex justify-center mb-10 px-4">
          <h5 className="text-[13px] font-bold uppercase tracking-[0.3em] text-[var(--text-bright)] text-center border-b border-[var(--border-main)] pb-4 px-6 leading-relaxed transition-all">
            {title}
          </h5>
        </div>
      )}
      
      <div className="w-full bg-[var(--bg-subpanel)] rounded-xl p-6 md:p-12 border border-[var(--border-main)] relative group isolation-auto transition-all shadow-sm">
        <div className="relative">
          <svg 
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto block overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Сетка - ЯВНЫЕ ЦВЕТА ИЗ CSS ПЕРЕМЕННЫХ */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => {
                 const y = padding + v * (height - padding * 2);
                 const x = padding + v * (width - padding * 2);
                 return (
                   <g key={v}>
                     <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 2" />
                     <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="4 2" />
                   </g>
                 );
            })}

            {/* Оси */}
            <line x1={getX(minX)} y1={getY(0)} x2={getX(maxX)} y2={getY(0)} stroke="var(--chart-axis)" strokeWidth="2" />
            <line x1={getX(0)} y1={getY(minY)} x2={getX(0)} y2={getY(maxY)} stroke="var(--chart-axis)" strokeWidth="2" />

            {/* Названия осей */}
            <text x={getX(maxX) + 15} y={getY(0)} fontSize="11" fill="var(--text-muted)" fontWeight="900" dominantBaseline="middle" className="uppercase tracking-widest">{xLabel || 'X'}</text>
            <text x={getX(0)} y={getY(maxY) - 20} fontSize="11" fill="var(--text-muted)" fontWeight="900" textAnchor="middle" className="uppercase tracking-widest">{yLabel || 'Y'}</text>

            {/* Подписи осей */}
            <text x={getX(minX)} y={getY(0) + 25} fontSize="12" fill="var(--text-main)" textAnchor="middle" fontWeight="700">{minX.toFixed(1)}</text>
            <text x={getX(maxX)} y={getY(0) + 25} fontSize="12" fill="var(--text-main)" textAnchor="middle" fontWeight="700">{maxX.toFixed(1)}</text>
            <text x={getX(0) - 20} y={getY(minY)} fontSize="12" fill="var(--text-main)" textAnchor="end" dominantBaseline="middle" fontWeight="700">{minY.toFixed(1)}</text>
            <text x={getX(0) - 20} y={getY(maxY)} fontSize="12" fill="var(--text-main)" textAnchor="end" dominantBaseline="middle" fontWeight="700">{maxY.toFixed(1)}</text>

            {processedDatasets.map((ds, i) => renderDataset(ds, i))}
          </svg>

          {hoveredPoint && (
            <div 
              className="absolute pointer-events-none z-[100] transition-all duration-200"
              style={{ 
                left: `${(getX(hoveredPoint.x) / width) * 100}%`,
                top: `${(getY(hoveredPoint.y) / height) * 100}%`,
                transform: `translate(${hoveredPoint.x > maxX * 0.7 ? '-100%' : hoveredPoint.x < minX + rangeX * 0.3 ? '0%' : '-50%'}, ${getY(hoveredPoint.y) < padding * 2 ? '20%' : '-120%'})`
              }}
            >
              <div 
                className="bg-[var(--bg-card)] px-4 py-3 rounded-xl shadow-xl border border-[var(--border-main)] whitespace-nowrap min-w-[130px]"
                style={{ borderLeft: `4px solid ${hoveredPoint.color}` }}
              >
                <div className="text-[12px] font-bold text-[var(--text-bright)] mb-1">{hoveredPoint.label}</div>
                <div className="text-[11px] font-medium text-[var(--text-muted)] font-mono">
                  x: {hoveredPoint.x.toFixed(2)} | y: {hoveredPoint.y.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-6">
        {processedDatasets.length > 1 && (
          <div className="flex flex-wrap justify-center bg-[var(--bg-card)] border border-[var(--border-main)] p-1 rounded-xl shadow-sm transition-all">
            <button 
              onClick={() => setActiveDataset(0)}
              className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeDataset === 0 ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >Все</button>
            {processedDatasets.map((ds, i) => (
              <button 
                key={i}
                onClick={() => setActiveDataset(i + 1)}
                className={`px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeDataset === (i + 1) ? 'shadow-sm text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                style={{ 
                  backgroundColor: activeDataset === (i + 1) ? ds.color || '#6366f1' : 'transparent'
                }}
              >
                {ds.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
