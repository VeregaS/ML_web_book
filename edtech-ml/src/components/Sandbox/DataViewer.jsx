import React from 'react';

/**
 * Рендерит массив объектов в виде HTML-таблицы.
 * Поддерживает горизонтальный скролл и липкие заголовки.
 */
export default function DataViewer({ data }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="w-full mt-4 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Инспектор данных (Pandas DataFrame)
        </span>
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col) => (
                <th key={col} className="px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 sticky top-0 bg-slate-50 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-slate-600 whitespace-nowrap tabular-nums">
                    {typeof row[col] === 'number' ? row[col].toFixed(4) : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
