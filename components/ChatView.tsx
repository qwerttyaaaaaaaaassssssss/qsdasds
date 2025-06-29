
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat, InteractionMode, Attachment } from '../types';
import { MessageBubble } from './MessageBubble';
import { SendIcon, SpinnerIcon, OnionLogo, ChatBubbleIcon, WebIcon, ImageIcon, FileTextIcon, PaperclipIcon, XIcon } from './Icons';

interface ChatViewProps {
  activeChat: Chat | null;
  onSendMessage: (text: string, mode: InteractionMode, attachment?: Attachment) => void;
  isLoading: boolean;
  startNewChat: () => void;
}

const ModeButton = ({ Icon, label, isActive, onClick }: { Icon: React.ElementType, label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-xs sm:text-sm ${
            isActive ? 'bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
        }`}
    >
        <Icon className="w-5 h-5 mb-1" />
        <span>{label}</span>
    </button>
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const StartScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full">
        <OnionLogo className="w-24 h-24 mb-4" />
        <h2 className="text-3xl font-bold text-gray-200">Como posso ajudar hoje?</h2>
        <p className="text-slate-400 mt-2 max-w-lg">
            Selecione um modo abaixo — Chat, Site, Imagem, ou Documento — e me diga o que você precisa.
            Você pode até anexar uma imagem para começarmos!
        </p>
        <div className="mt-8 text-left bg-slate-900/50 p-6 rounded-lg max-w-md w-full border border-slate-700">
            <h3 className="font-semibold text-lg mb-3 text-white">Experimente estes exemplos:</h3>
            <ul className="list-none text-slate-300 space-y-2">
                <li className="flex items-center gap-3"><ChatBubbleIcon className="w-5 h-5 text-violet-400"/><span>Converse sobre as últimas tendências de IA.</span></li>
                <li className="flex items-center gap-3"><WebIcon className="w-5 h-5 text-violet-400"/><span>Crie um site de portfólio com tema escuro.</span></li>
                <li className="flex items-center gap-3"><ImageIcon className="w-5 h-5 text-violet-400"/><span>Gere uma imagem de um astronauta em um cavalo.</span></li>
                <li className="flex items-center gap-3"><FileTextIcon className="w-5 h-5 text-violet-400"/><span>Escreva um e-mail profissional para um cliente.</span></li>
            </ul>
        </div>
    </div>
);

export const ChatView: React.FC<ChatViewProps> = ({ activeChat, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<InteractionMode>('chat');
  const [attachment, setAttachment] = useState<Attachment | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modeConfigs: Record<InteractionMode, { placeholder: string; buttonText: string }> = useMemo(() => ({
    chat: { placeholder: 'Converse com o CebolaGPT...', buttonText: 'Enviar' },
    website: { placeholder: 'Descreva o site que você quer criar...', buttonText: 'Gerar' },
    image: { placeholder: 'Descreva a imagem que você quer gerar...', buttonText: 'Gerar' },
    document: { placeholder: 'Descreva o documento ou texto que quer criar...', buttonText: 'Gerar' },
  }), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const base64Data = await fileToBase64(file);
        setAttachment({ type: 'image', name: file.name, data: base64Data });
    }
    // Reset file input value to allow selecting the same file again
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = () => {
    if ((inputText.trim() || attachment) && !isLoading) {
      onSendMessage(inputText, mode, attachment);
      setInputText('');
      setAttachment(undefined);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const hasMessages = activeChat && activeChat.messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-800">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {hasMessages ? (
            <div className="max-w-4xl mx-auto space-y-6">
                {activeChat.messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && activeChat.messages[activeChat.messages.length - 1]?.role !== 'model' && (
                    <div className="flex justify-center"><SpinnerIcon className="w-6 h-6 animate-spin text-violet-400" /></div>
                )}
                <div ref={messagesEndRef} />
            </div>
        ) : (
            <StartScreen />
        )}
      </div>

      <div className="p-4 md:p-6 bg-slate-800 border-t border-slate-700">
        <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <ModeButton Icon={ChatBubbleIcon} label="Chat" isActive={mode === 'chat'} onClick={() => setMode('chat')} />
                <ModeButton Icon={WebIcon} label="Site" isActive={mode === 'website'} onClick={() => setMode('website')} />
                <ModeButton Icon={ImageIcon} label="Imagem" isActive={mode === 'image'} onClick={() => setMode('image')} />
                <ModeButton Icon={FileTextIcon} label="Documento" isActive={mode === 'document'} onClick={() => setMode('document')} />
            </div>
            {attachment && (
                <div className="mb-2 p-2 bg-slate-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                        <img src={attachment.data} alt="preview" className="w-10 h-10 rounded-md object-cover" />
                        <span className="truncate">{attachment.name}</span>
                    </div>
                    <button onClick={() => setAttachment(undefined)} className="p-1 text-slate-400 hover:text-white">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className="bg-slate-700 rounded-xl p-2 flex items-end">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden/>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-violet-400 transition-colors"
                    aria-label="Anexar arquivo"
                >
                    <PaperclipIcon className="w-5 h-5"/>
                </button>
                <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={modeConfigs[mode].placeholder}
                    className="flex-1 bg-transparent text-gray-100 p-2 focus:outline-none resize-none custom-scrollbar"
                    rows={1}
                    style={{maxHeight: '200px'}}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || (!inputText.trim() && !attachment)}
                    className="p-2 rounded-full bg-violet-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors"
                    aria-label={modeConfigs[mode].buttonText}
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};