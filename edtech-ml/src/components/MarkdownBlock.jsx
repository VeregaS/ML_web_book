import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import DocTooltip from './DocTooltip';
import 'katex/dist/katex.min.css';

const GLOSSARY = {
  'MSE': {
    definition: 'Среднеквадратичная ошибка. Мера близости линии регрессии к точкам данных.',
    example: 'mse = np.mean((y_true - y_pred)**2)'
  },
  'NumPy': {
    definition: 'Библиотека для работы с многомерными массивами и высокоуровневыми математическими функциями.',
    example: 'import numpy as np; a = np.array([1, 2, 3])'
  },
  'Matplotlib': {
    definition: 'Библиотека для визуализации данных и построения 2D-графиков.',
    example: 'import matplotlib.pyplot as plt; plt.plot(x, y)'
  },
  'Векторизация': {
    definition: 'Процесс применения операций сразу ко всему массиву данных без использования явных циклов.',
    example: 'result = array * 10 # Вместо цикла for'
  }
};

export default function MarkdownBlock({ content }) {
  return (
    <div className="text-lg leading-relaxed text-slate-800 space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, children, ...props }) => {
            // Безопасно преобразуем children в массив
            const childrenArray = React.Children.toArray(children);
            
            const processedChildren = childrenArray.map((child, idx) => {
              if (typeof child === 'string') {
                // Разделяем на слова, сохраняя разделители (пробелы, знаки препинания)
                const words = child.split(/(\b[\w\u0400-\u04FF]+\b)/g);
                return words.map((word, wIdx) => {
                  const term = Object.keys(GLOSSARY).find(t => t.toLowerCase() === word.toLowerCase());
                  if (term) {
                    return (
                      <DocTooltip 
                        key={`${idx}-${wIdx}`}
                        term={word} 
                        definition={GLOSSARY[term].definition} 
                        example={GLOSSARY[term].example} 
                      />
                    );
                  }
                  return word;
                });
              }
              return child;
            });
            return <p className="mb-4" {...props}>{processedChildren}</p>;
          },
          strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
          code: ({ node, inline, ...props }) => 
            inline ? (
              <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code {...props} />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}