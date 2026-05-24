import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import DocTooltip from './DocTooltip';
import ChartBlock from './ChartBlock';
import { GLOBAL_GLOSSARY } from '../utils/glossary';
import 'katex/dist/katex.min.css';

export default function MarkdownBlock({ content, extraGlossary = {}, excludeTerm = null, isGlossaryMode = false }) {
  const glossary = useMemo(() => {
    const base = { ...GLOBAL_GLOSSARY, ...extraGlossary };
    if (excludeTerm) {
      const filtered = { ...base };
      const keyToExclude = Object.keys(filtered).find(
        k => k.toLowerCase() === excludeTerm.toLowerCase()
      );
      if (keyToExclude) delete filtered[keyToExclude];
      return filtered;
    }
    return base;
  }, [extraGlossary, excludeTerm]);

  const terms = useMemo(() => Object.keys(glossary).sort((a, b) => b.length - a.length), [glossary]);

  const processText = (text) => {
    if (typeof text !== 'string' || text.trim() === '' || terms.length === 0) return text;

    // Умный стемминг: отрезаем русские окончания, чтобы находить слова в любых падежах
    const createStemPattern = (term) => {
      const words = term.split(/\\s+/);
      const stemmed = words.map(w => {
        if (w.length <= 4) return w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
        // Популярные окончания
        const stem = w.replace(/(а|я|о|е|и|ы|у|ю|ой|ий|ый|ая|ое|ою|ию|ие|ии|ь|ью|ом|ам|ем|ями|ами|ах|ях|их|ых)$/i, '');
        if (stem.length < 3) return w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
        return stem.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
      });
      // Для многословных терминов разрешаем любые символы между корнями (окончания первого слова)
      return stemmed.join('[a-zA-Zа-яА-ЯёЁ]*\\\\s+');
    };

    const pattern = `(${terms.map(t => createStemPattern(t)).join('|')})`;
    const regex = new RegExp(pattern, 'gi');
    
    const parts = text.split(regex);
    if (parts.length === 1) return text;

    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (i % 2 === 1) {
        // Проверка начала слова/фразы
        const prevPart = parts[i - 1] || "";
        const isWordStart = prevPart === "" || /[^a-zA-Zа-яА-ЯёЁ0-9]$/.test(prevPart);

        if (isWordStart) {
          const nextPart = parts[i + 1] || "";
          // Хвост (окончание последнего слова)
          const tailMatch = nextPart.match(/^[a-zA-Zа-яА-ЯёЁ]{0,5}/);
          const tail = tailMatch ? tailMatch[0] : "";
          
          const afterTail = nextPart.substring(tail.length);
          const isWordEnd = afterTail === "" || /^[^a-zA-Zа-яА-ЯёЁ0-9]/.test(afterTail);

          if (isWordEnd) {
            parts[i + 1] = afterTail;
            const fullWord = part + tail;
            
            // Находим оригинальный термин, чей стем совпал с найденной строкой
            const termKey = terms.find(t => {
               const p = new RegExp('^' + createStemPattern(t) + '$', 'i');
               return p.test(part);
            });

            if (termKey) {
              result.push(
                <DocTooltip 
                  key={`${fullWord}-${i}`}
                  term={fullWord}
                  originalTerm={termKey}
                  definition={glossary[termKey].definition} 
                  example={glossary[termKey].example} 
                  isGlossaryMode={isGlossaryMode}
                />
              );
              continue;
            }
          }
        }
        result.push(part);
      } else {
        if (part) result.push(part);
      }
    }
    return result;
  };

  const enhance = (children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') return processText(child);
      return child;
    });
  };

  if (!content) return null;

  return (
    <div className="text-[var(--text-main)] space-y-4 prose-sm max-w-none transition-colors">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-4 leading-relaxed">{enhance(children)}</p>,
          li: ({ children }) => <li className="mb-1">{enhance(children)}</li>,
          h1: ({ children }) => <h1 className="text-3xl font-bold mb-6">{enhance(children)}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mb-4">{enhance(children)}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold mb-3">{enhance(children)}</h3>,
          
          // Жирный текст — обрабатываем только если он не является названием текущего термина
          strong: ({ children }) => {
            // Если текст внутри тега совпадает с исключенным термином (названием карточки),
            // мы не ищем в нем другие термины. Это убирает подсветку "производная" внутри "Частная производная".
            const contentString = React.Children.toArray(children).join('').toLowerCase();
            const isExposedTerm = excludeTerm && contentString.includes(excludeTerm.toLowerCase());
            
            return (
              <strong className="font-bold text-[var(--text-bright)]">
                {isExposedTerm ? children : enhance(children)}
              </strong>
            );
          },
          em: ({ children }) => <em className="italic">{enhance(children)}</em>,
          
          table: ({ children }) => (
            <div className="glossary-table-container custom-scrollbar w-full overflow-hidden mb-8 border border-[var(--border-main)] rounded-xl transition-all bg-[var(--bg-card)]">
              <table className="w-full border-collapse table-fixed md:table-auto">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--bg-subpanel)] border-b-2 border-[var(--border-main)] transition-all">{children}</thead>,
          th: ({ children }) => <th className="px-6 py-4 font-bold text-[var(--text-bright)] text-left text-[11px] uppercase tracking-widest bg-[var(--bg-subpanel)] transition-all border-b border-[var(--border-main)]">{children}</th>,
          td: ({ children }) => <td className="px-6 py-4 border-b border-[var(--border-light)] text-[var(--text-main)] text-sm leading-relaxed transition-all">{children}</td>,
          tr: ({ children }) => <tr className="last:border-0 hover:bg-[var(--bg-subpanel)] transition-colors">{children}</tr>,
          
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            if (lang === 'chart') return <ChartBlock content={String(children).replace(/\n$/, '')} />;
            return inline ? (
              <code className="bg-[var(--bg-subpanel)] border border-[var(--border-light)] text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-sm font-mono transition-colors" {...props}>{children}</code>
            ) : <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
