
import React from 'react';
import { Message } from '../types';
import { OnionLogo, CodeIcon, DownloadIcon, SpinnerIcon } from './Icons';
import { CodeRenderer } from './CodeRenderer';

interface MessageBubbleProps {
  message: Message;
}

const UserAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center font-bold text-gray-300 flex-shrink-0">
        U
    </div>
);

const ModelAvatar = () => <OnionLogo className="w-8 h-8 flex-shrink-0" />;

const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <ModelAvatar />}
      <div className={`max-w-2xl w-full flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-violet-700 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
          <div className="prose prose-invert prose-sm max-w-none break-words">
            {message.isGenerating && message.text === '' && (
              <div className="flex items-center gap-2">
                <SpinnerIcon className="w-5 h-5 animate-spin" />
                <span>Pensando...</span>
              </div>
            )}
            
            {message.attachment && message.attachment.type === 'image' && (
              <div className="mb-2">
                <img src={message.attachment.data} alt={message.attachment.name} className="rounded-lg max-w-xs h-auto"/>
              </div>
            )}
            
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}

            {message.imageUrl && (
              <div className="mt-2">
                <img src={message.imageUrl} alt="Conteúdo gerado" className="rounded-lg max-w-full h-auto" />
              </div>
            )}

            {message.code && <CodeRenderer code={message.code} />}
          </div>
        </div>
        {!isUser && !message.isGenerating && (message.text.length > 200 || message.code) && (
            <div className="mt-2 flex gap-2">
                {message.code && (
                    <button onClick={() => handleDownload(message.code!.content, `cebola-codigo.${message.code!.language}`)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                        <CodeIcon className="w-3 h-3"/> Baixar Código
                    </button>
                )}
                {message.text.length > 200 && !message.code && (
                    <button onClick={() => handleDownload(message.text, 'cebola-documento.txt')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                        <DownloadIcon className="w-3 h-3"/> Baixar Documento (.txt)
                    </button>
                )}
            </div>
        )}
      </div>
       {isUser && <UserAvatar />}
    </div>
  );
};