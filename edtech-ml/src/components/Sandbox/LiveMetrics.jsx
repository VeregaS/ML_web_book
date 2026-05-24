import React from 'react';
import { motion } from 'framer-motion';

/**
 * Отрисовывает динамический график Loss-кривой через SVG.
 * Принимает массив [{epoch, loss}, ...]
 */
export default function LiveMetrics({ metrics }) {
  if (!metrics || metrics.length < 2) return null;

  const width = 500;
  const height = 200;
  const padding = 30;

  const epochs = metrics.map(m => m.epoch);
  const losses = metrics.map(m => m.loss);

  const minEpoch = Math.min(...epochs);
  const maxEpoch = Math.max(...epochs);
  const minLoss = 0; // Для визуализации потерь обычно начинаем с 0
  const maxLoss = Math.max(...losses) * 1.1; // Запас 10% сверху

  const getX = (epoch) => padding + ((epoch - minEpoch) / (maxEpoch - minEpoch || 1)) * (width - padding * 2);
  const getY = (loss) => height - padding - ((loss - minLoss) / (maxLoss - minLoss || 1)) * (height - padding * 2);

  const points = metrics.map(m => `${getX(m.epoch)},${getY(m.loss)}`).join(' ');

  return (
    <div className="w-full mt-4 bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"></span>
        Кривая обучения (Loss Curve)
      </h4>
      <div className="relative overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Grid Lines */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
          
          {/* Path */}
          <motion.polyline
            fill="none"
            stroke="#4F39F6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
          />

          {/* Data Points */}
          {metrics.map((m, i) => (
            <circle
              key={i}
              cx={getX(m.epoch)}
              cy={getY(m.loss)}
              r="3"
              fill="#4F39F6"
              className="shadow-sm"
            />
          ))}
        </svg>
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
        <span>Epoch {minEpoch}</span>
        <span>Epoch {maxEpoch}</span>
      </div>
    </div>
  );
}
