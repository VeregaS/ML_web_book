import React from 'react';

export default function DataViewer({ data }) {
  if (!data || !data.length) return null;

  const columns = Object.keys(data[0]);

  return (
    <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Инспектор датасета (DataFrame)
        </span>
        <span className="text-[10px] font-medium text-slate-400">
          Строк: {data.length}
        </span>
      </div>
      <div className="overflow-x-auto max-h-60 custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col, idx) => (
                <th key={idx} className="p-2 border-b border-slate-200 font-bold text-slate-700 whitespace-nowrap sticky top-0 bg-white">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="p-2 text-slate-600 whitespace-nowrap">
                    {typeof row[col] === 'number' ? Number(row[col]).toPrecision(4) : String(row[col])}
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
