import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import ChatInput from './chat/ChatInput';
import MessagesList from './chat/MessagesList';
import type { ChatResponse, FormData, Message } from './chat/types';

const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const conversationId = useRef(crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    mode: 'onChange',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const onSubmit = async ({ message }: FormData) => {
    if (!message.trim() || loading) return;

    const now = new Date().toISOString();
    setMessages((prev) => [...prev, { content: message, role: 'user', timestamp: now }]);

    reset();
    setLoading(true);

    try {
      const { data } = await axios.post<ChatResponse>('/api/chat', {
        message,
        conversationId: conversationId.current,
      });

      setMessages((prev) => [
        ...prev,
        {
          content: data.reply,
          role: 'bot',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          content: '❌ Failed to reach server',
          role: 'bot',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <MessagesList messages={messages} loading={loading} bottomRef={bottomRef} />
      <ChatInput
        loading={loading}
        isValid={formState.isValid}
        register={register}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default ChatBot;
