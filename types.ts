
export type MessageRole = 'user' | 'model';

export type InteractionMode = 'chat' | 'website' | 'image' | 'document';

export interface Attachment {
  type: 'image';
  name: string;
  data: string; // base64 data url
}

export interface CodeBlock {
  language: string;
  content: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  imageUrl?: string;
  code?: CodeBlock;
  attachment?: Attachment;
  isGenerating?: boolean;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface PreviewContent {
    type: 'html' | 'document';
    content: string;
    language?: string;
}