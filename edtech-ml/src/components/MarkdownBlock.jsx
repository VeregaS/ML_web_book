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

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const processText = (text) => {
    if (typeof text !== 'string' || text.trim() === '') return text;

    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    const pattern = `(${terms.map(t => escapeRegExp(t)).join('|')})`;
    const regex = new RegExp(pattern, 'gi');
    
    const parts = text.split(regex);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase().trim();
      const termKey = Object.keys(glossary).find(k => k.toLowerCase() === lowerPart);

      if (termKey) {
        return (
          <DocTooltip 
            key={`${lowerPart}-${i}`}
            term={part} 
            definition={glossary[termKey].definition} 
            example={glossary[termKey].example} 
            isGlossaryMode={isGlossaryMode}
          />
        );
      }
      return part;
    });
  };

  const enhance = (children) => {
    return React.Children.map(children, child => {
      if (typeof child === 'string') return processText(child);
      return child;
    });
  };

  if (!content) return null;

  return (
    <div className="text-slate-800 space-y-4 prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => <p className="mb-4 leading-relaxed">{enhance(children)}</p>,
          li: ({ children }) => <li className="mb-1">{enhance(children)}</li>,
          strong: ({ children }) => <strong className="font-bold text-slate-950">{enhance(children)}</strong>,
          em: ({ children }) => <em className="italic">{enhance(children)}</em>,
          
          table: ({ children }) => (
            <div className="glossary-table-container custom-scrollbar w-full overflow-hidden mb-8">
              <table className="w-full border-collapse table-fixed md:table-auto">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50/80 border-b-2 border-slate-100">{children}</thead>,
          th: ({ children }) => (
            <th className="px-6 py-4 font-black text-slate-900 text-left text-[11px] uppercase tracking-widest bg-slate-50/50">
              {enhance(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 border-b border-slate-50 text-slate-600 text-sm leading-relaxed">
              {enhance(children)}
            </td>
          ),
          tr: ({ children }) => <tr className="last:border-0 hover:bg-slate-50/50 transition-colors">{children}</tr>,
          
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';

            if (lang === 'chart') {
              return <ChartBlock content={String(children).replace(/\n$/, '')} />;
            }

            return inline ? (
              <code className="bg-slate-100 text-rose-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
