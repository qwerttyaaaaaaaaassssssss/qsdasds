
import React from 'react';
import { Chat } from '../types';
import { OnionLogo, PlusIcon, TrashIcon } from './Icons';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }) => {
  const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
  
  return (
    <aside className="w-72 bg-slate-900 flex flex-col p-2 space-y-2 h-full border-r border-slate-700">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
            <OnionLogo className="w-9 h-9"/>
            <h1 className="text-xl font-bold text-gray-100">CebolaGPT</h1>
        </div>
      </div>
      
      <button 
        onClick={onNewChat}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors"
      >
        <PlusIcon className="w-5 h-5"/>
        Nova Conversa
      </button>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
        <nav className="space-y-1 p-1">
          {sortedChats.map(chat => (
            <div
              key={chat.id}
              className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left rounded-md cursor-pointer transition-colors ${
                activeChatId === chat.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="truncate flex-grow">{chat.title}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="ml-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Deletar chat"
              >
                  <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </nav>
      </div>
      <div className="p-2 text-xs text-center text-slate-500">
        O histórico de conversas é salvo no seu navegador.
      </div>
    </aside>
  );
};