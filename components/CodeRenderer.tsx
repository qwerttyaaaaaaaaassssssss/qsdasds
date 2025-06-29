import React from 'react';
import { CodeBlock } from '../types';

interface CodeRendererProps {
  code: CodeBlock;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({ code }) => {
  const isUnsupportedPreview = ['php', 'rb', 'py'].includes(code.language.toLowerCase());

  return (
    <div className="mt-4 bg-slate-900 rounded-lg overflow-hidden border border-slate-600">
      <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400 flex justify-between items-center">
        <span>{code.language.toUpperCase()}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code.content)}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Copiar Código
        </button>
      </div>
      <div className="p-4 text-sm font-mono overflow-x-auto custom-scrollbar bg-black bg-opacity-20">
        <pre><code>{code.content}</code></pre>
      </div>
      {isUnsupportedPreview && (
         <div className="p-4 border-t border-yellow-600/50 bg-yellow-900/20 text-yellow-300 text-xs">
           <strong>Aviso:</strong> {code.language.toUpperCase()} é uma linguagem de servidor. A visualização ao vivo não pode ser exibida aqui.
         </div>
      )}
    </div>
  );
};