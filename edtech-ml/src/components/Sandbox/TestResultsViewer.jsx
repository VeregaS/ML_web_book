import React from 'react';
import { motion } from 'framer-motion';

/**
 * Профессиональный компонент для отображения результатов тестов в стиле LeetCode/Grader.
 */
export default function TestResultsViewer({ testResults }) {
  if (!testResults || testResults.wasSuccessful) return null;

  // Парсим детали из вывода (ожидаем формат AssertionError: actual != expected)
  const parseDetails = (msg) => {
    // Пытаемся найти паттерны AssertionError
    const assertMatch = msg.match(/AssertionError: (.*?) != (.*)/) || 
                       msg.match(/AssertionError: (.*?) is not (.*)/) ||
                       msg.match(/AttributeError: (.*)/);
    
    if (assertMatch) {
      if (assertMatch.length === 3) {
        return { actual: assertMatch[1], expected: assertMatch[2], type: 'Mismatch' };
      }
      return { error: assertMatch[1], type: 'Error' };
    }
    return { error: msg, type: 'Failed' };
  };

  const failures = [...testResults.failures, ...testResults.errors].map(f => parseDetails(f));

  return (
    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-rose-50 border border-rose-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-rose-100/50 px-4 py-2 border-b border-rose-100 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Результаты проверки</span>
          <span className="text-[10px] font-bold text-rose-500 italic">Тесты не пройдены</span>
        </div>
        
        <div className="p-4 space-y-4">
          {failures.map((f, i) => (
            <div key={i} className="space-y-3">
              {f.actual !== undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ожидалось:</span>
                    <div className="bg-white border border-slate-200 p-2 rounded-lg font-mono text-xs text-emerald-600 overflow-x-auto">
                      {f.expected}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Получено:</span>
                    <div className="bg-white border border-rose-200 p-2 rounded-lg font-mono text-xs text-rose-600 overflow-x-auto">
                      {f.actual}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ошибка:</span>
                  <div className="bg-rose-950 text-rose-100 p-3 rounded-lg font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap border border-rose-800">
                    {f.error}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <p className="text-[10px] text-slate-400 text-center italic">
        Совет: проверьте названия функций и корректность математических операций.
      </p>
    </div>
  );
}
