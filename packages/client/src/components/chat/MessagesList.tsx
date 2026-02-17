import type { RefObject } from 'react';
import MessageBubble from './MessageBubble';
import type { Message } from './types';

type MessagesListProps = {
  messages: Message[];
  loading: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
};

const MessagesList = ({ messages, loading, bottomRef }: MessagesListProps) => {
  return (
    <section
      className="max-h-[65vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 shadow-inner"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message, index) => (
        <MessageBubble key={`${message.timestamp}-${index}`} message={message} />
      ))}

      {loading && (
        <div className="flex items-end gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-sm text-white shadow-sm">
            🤖
          </div>
          <div className="rounded-2xl rounded-bl-md border border-indigo-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
            <span className="animate-pulse">typing…</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </section>
  );
};

export default MessagesList;
