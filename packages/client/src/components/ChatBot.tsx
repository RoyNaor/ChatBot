import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaArrowUp } from 'react-icons/fa';
import clsx from 'clsx';

type FormData = {
  message: string;
};

type ChatResponse = {
  reply: string;
};

type Message = {
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
};

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
    if (!message.trim()) return;

    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { content: message, role: 'user', timestamp: now },
    ]);

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
    <div className="mx-auto w-full max-w-3xl flex flex-col gap-4">
      {/* Messages */}
      <div className="flex flex-col gap-3 p-4 max-h-[65vh] overflow-y-auto bg-slate-50 rounded-2xl shadow-inner">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              'flex gap-3 items-end',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'bot' && (
              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
                🤖
              </div>
            )}

            <div className="max-w-[78%]">
              <div
                className={clsx(
                  'px-4 py-2 rounded-2xl text-sm leading-snug shadow-sm',
                  msg.role === 'user'
                    ? 'bg-emerald-300 text-emerald-950 rounded-br-md'
                    : 'bg-indigo-100 text-indigo-950 rounded-bl-md'
                )}
              >
                {msg.content}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-full border grid place-items-center text-xs font-medium">
                You
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-end">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
              🤖
            </div>
            <div className="px-4 py-2 rounded-2xl bg-indigo-100 text-indigo-900 text-sm animate-pulse">
              typing…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <textarea
          {...register('message', {
            required: true,
            validate: (v) => v.trim().length > 0,
          })}
          placeholder="Ask anything…"
          maxLength={500}
          className="w-full min-h-[90px] resize-none rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement)?.requestSubmit();
            }
          }}
        />

        <div className="flex justify-end">
          <button
            disabled={!formState.isValid || loading}
            className={clsx(
              'w-10 h-10 rounded-full grid place-items-center transition',
              formState.isValid && !loading
                ? 'bg-emerald-400 hover:bg-emerald-500'
                : 'bg-slate-300 cursor-not-allowed'
            )}
          >
            <FaArrowUp />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;
