import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ChatInput } from './chat/ChatInput';
import { Message } from './chat/Message';
import { TypingIndicator } from './chat/TypingIndicator';
import type { ChatFormData, ChatMessage, ChatResponse } from './chat/types';

const ChatBot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const conversationId = useRef(crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<ChatFormData>({
    mode: 'onChange',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const onSubmit = async ({ message }: ChatFormData) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    setMessages((previousMessages) => [
      ...previousMessages,
      { content: trimmedMessage, role: 'user', timestamp: new Date().toISOString() },
    ]);

    reset();
    setLoading(true);

    try {
      const { data } = await axios.post<ChatResponse>('/api/chat', {
        message: trimmedMessage,
        conversationId: conversationId.current,
      });

      setMessages((previousMessages) => [
        ...previousMessages,
        { content: data.reply, role: 'bot', timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      const fallbackMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message || 'Failed to reach server'
        : 'Unexpected error while sending your message';

      setMessages((previousMessages) => [
        ...previousMessages,
        { content: `❌ ${fallbackMessage}`, role: 'bot', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
      <div className="flex flex-col gap-3 p-4 max-h-[65vh] overflow-y-auto bg-slate-50 rounded-2xl shadow-inner">
        {messages.map((message) => (
          <Message key={`${message.timestamp}-${message.role}`} message={message} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput loading={loading} register={register} handleSubmit={handleSubmit} onSubmit={onSubmit} formState={formState} />
    </div>
  );
};

export default ChatBot;
