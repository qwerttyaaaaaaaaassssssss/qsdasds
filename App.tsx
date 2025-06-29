
import React from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { useChatManager } from './hooks/useChatManager';
import { PreviewPanel } from './components/PreviewPanel';

function App() {
  const chatManager = useChatManager();

  return (
    <div className="flex h-screen w-full bg-slate-900 text-gray-100 font-sans">
      <Sidebar
        chats={chatManager.chats}
        activeChatId={chatManager.activeChatId}
        onNewChat={chatManager.startNewChat}
        onSelectChat={chatManager.setActiveChatId}
        onDeleteChat={chatManager.deleteChat}
      />
      <main className="flex-1 flex flex-row bg-slate-800 h-full">
        <div className="flex-1 flex flex-col h-full">
            <ChatView
              key={chatManager.activeChatId} // Force re-mount on chat change
              activeChat={chatManager.getActiveChat()}
              onSendMessage={chatManager.sendMessage}
              isLoading={chatManager.isLoading}
              startNewChat={chatManager.startNewChat}
            />
        </div>
        {chatManager.previewContent && (
            <PreviewPanel 
                content={chatManager.previewContent}
                onClose={() => chatManager.setPreviewContent(null)}
            />
        )}
      </main>
    </div>
  );
}

export default App;