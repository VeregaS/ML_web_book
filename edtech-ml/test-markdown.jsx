import React from 'react';
import { renderToString } from 'react-dom/server';
import MarkdownBlock from './src/components/MarkdownBlock.jsx';

const content = `
**Логистическая регрессия** — это фундамент. 

Вместо прямой линии, как в линейной регрессии, мы используем **Сигмоиду**.
`;

const extraGlossary = {
  "Сигмоида": { definition: "Функция" },
  "Логистическая регрессия": { definition: "Алгоритм" }
};

const html = renderToString(<MarkdownBlock content={content} extraGlossary={extraGlossary} />);
console.log("HTML OUTPUT:");
console.log(html);
