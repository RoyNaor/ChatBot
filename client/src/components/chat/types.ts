export type ChatFormData = {
  message: string;
};

export type ChatResponse = {
  reply: string;
};

export type ChatMessage = {
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
};
