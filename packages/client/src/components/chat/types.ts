export type FormData = {
  message: string;
};

export type ChatResponse = {
  reply: string;
};

export type MessageRole = 'user' | 'bot';

export type Message = {
  content: string;
  role: MessageRole;
  timestamp: string;
};
