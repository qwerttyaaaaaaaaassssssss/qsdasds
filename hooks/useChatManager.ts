
import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message, InteractionMode, Attachment, PreviewContent } from '../types';
import { streamChatResponse, generateImage } from '../services/geminiService';

const parseCodeFromText = (text: string) => {
  const codeBlockRegex = /```(\w+)\s*([\s\S]*?)```/s;
  const match = text.match(codeBlockRegex);
  if (match) {
    return {
      language: match[1] || 'text',
      content: match[2].trim(),
      cleanedText: text.replace(codeBlockRegex, '').trim(),
    };
  }
  return null;
};

export const useChatManager = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null);

  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('cebola_chats');
      if (savedChats) {
        const parsedChats: Chat[] = JSON.parse(savedChats);
        setChats(parsedChats);
        if (parsedChats.length > 0 && !activeChatId) {
           const sortedChats = [...parsedChats].sort((a, b) => b.createdAt - a.createdAt);
           setActiveChatId(sortedChats[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load chats from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (chats.length > 0) {
        localStorage.setItem('cebola_chats', JSON.stringify(chats));
      } else if (localStorage.getItem('cebola_chats')) {
        localStorage.removeItem('cebola_chats');
      }
    } catch (error) {
      console.error("Failed to save chats to localStorage", error);
    }
  }, [chats]);
  
  const customSetActiveChatId = (id: string | null) => {
      setActiveChatId(id);
      setPreviewContent(null);
  };

  const getActiveChat = useCallback(() => {
    return chats.find(chat => chat.id === activeChatId) || null;
  }, [chats, activeChatId]);

  const updateMessage = (chatId: string, messageId: string, updates: Partial<Message>) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: chat.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          };
        }
        return chat;
      })
    );
  };
  
  const addMessageToChat = (chatId: string, message: Message) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    );
  };

  const startNewChat = useCallback(() => {
    const newChat: Chat = {
      id: uuidv4(),
      title: 'Nova Conversa',
      messages: [],
      createdAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    customSetActiveChatId(newChat.id);
    return newChat.id;
  }, []);
  
  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
        const remainingChats = chats.filter(c => c.id !== chatId);
        const sorted = [...remainingChats].sort((a, b) => b.createdAt - a.createdAt);
        customSetActiveChatId(sorted.length > 0 ? sorted[0].id : null);
    }
  }, [activeChatId, chats]);

  const sendMessage = useCallback(async (text: string, mode: InteractionMode, attachment?: Attachment) => {
    let currentChatId = activeChatId;
    if (!currentChatId) {
        currentChatId = startNewChat();
    }

    setIsLoading(true);

    const userMessage: Message = { id: uuidv4(), role: 'user', text, attachment };
    addMessageToChat(currentChatId, userMessage);
    
    const modelMessageId = uuidv4();

    if (mode === 'image') {
        addMessageToChat(currentChatId, { id: modelMessageId, role: 'model', text: `Gerando imagem de: "${text}"...`, isGenerating: true });
        const imageUrl = await generateImage(text);
        if (imageUrl) {
            updateMessage(currentChatId, modelMessageId, { text: `Aqui está a imagem que você pediu:`, imageUrl, isGenerating: false });
        } else {
            updateMessage(currentChatId, modelMessageId, { text: "Desculpe, não consegui gerar a imagem.", isGenerating: false });
        }
        setIsLoading(false);
        return;
    }
    
    let apiPrompt = text;
    if (mode === 'website') {
      apiPrompt = `Você é um especialista em desenvolvimento web. Crie um site completo e funcional com base na seguinte descrição. Forneça um único arquivo HTML contendo todo o CSS e JavaScript necessários em um único bloco de código \`\`\`html. Não adicione nenhuma explicação fora do bloco de código.\n\nDescrição: "${text}"`;
    } else if (mode === 'document') {
      apiPrompt = `Você é um assistente de escrita. Crie um documento de texto detalhado e bem estruturado com base na seguinte descrição. Responda apenas com o conteúdo do documento, usando Markdown para formatação (títulos, listas, negrito, etc.).\n\nDescrição: "${text}"`;
    }
    
    const chatForHistory = getActiveChat();
    const previousMessages = chatForHistory ? chatForHistory.messages : [];
    const modifiedUserMessage = { ...userMessage, text: apiPrompt };
    const historyForApi = [...previousMessages, modifiedUserMessage];
    
    addMessageToChat(currentChatId, { id: modelMessageId, role: 'model', text: '', isGenerating: true });
    
    await streamChatResponse(
      historyForApi,
      (chunk) => { // onChunk
        setChats(prevChats =>
          prevChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: chat.messages.map(msg =>
                  msg.id === modelMessageId ? { ...msg, text: msg.text + chunk } : msg
                ),
              };
            }
            return chat;
          })
        );
      },
      (fullText) => { // onComplete
        const codeInfo = parseCodeFromText(fullText);
        const finalMessageUpdates: Partial<Message> = {
          text: codeInfo?.cleanedText || fullText,
          code: codeInfo ? { language: codeInfo.language, content: codeInfo.content } : undefined,
          isGenerating: false
        };
        updateMessage(currentChatId, modelMessageId, finalMessageUpdates);
        setIsLoading(false);
        
        if (mode === 'website' && codeInfo && codeInfo.language === 'html') {
            setPreviewContent({ type: 'html', content: codeInfo.content });
        } else if (mode === 'document') {
            setPreviewContent({ type: 'document', content: fullText, language: 'markdown' });
        }

        setChats(prev => {
            const finalChatState = prev.find(c => c.id === currentChatId);
            // Title is generated after the first user message and model response.
            if (finalChatState && finalChatState.messages.length >= 2 && finalChatState.title === 'Nova Conversa') {
                const firstMessage = finalChatState.messages[0];
                let titleText = firstMessage.text; 

                if (!titleText && firstMessage.attachment) {
                    titleText = `Imagem: ${firstMessage.attachment.name}`;
                }

                if (titleText) {
                    const newTitle = titleText.substring(0, 30) + (titleText.length > 30 ? "..." : "");
                    return prev.map(c => c.id === currentChatId ? {...c, title: newTitle} : c);
                }
            }
            return prev;
        });
      }
    );

  }, [activeChatId, chats, startNewChat, getActiveChat]);

  return { chats, activeChatId, isLoading, getActiveChat, startNewChat, sendMessage, setActiveChatId: customSetActiveChatId, deleteChat, previewContent, setPreviewContent };
};
