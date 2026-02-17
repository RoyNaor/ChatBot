import clsx from 'clsx';
import { getMessageMeta } from './language';
import type { Message } from './types';

type MessageBubbleProps = {
  message: Message;
};

const formatMessageTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const { direction, isRtl } = getMessageMeta(message.content);

  return (
    <div className={clsx('flex items-end gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm text-white shadow-sm">
          🤖
        </div>
      )}

      <div className={clsx('max-w-[82%] sm:max-w-[76%]', isUser && 'items-end')}>
        <div
          dir={direction}
          className={clsx(
            'whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm [unicode-bidi:plaintext]',
            isRtl ? 'text-right' : 'text-left',
            isUser
              ? 'rounded-br-md bg-emerald-400 text-emerald-950'
              : clsx(
                  'border border-indigo-100 bg-white text-slate-800',
                  isRtl ? 'rounded-br-md' : 'rounded-bl-md'
                )
          )}
        >
          {message.content}
        </div>
        <p className={clsx('mt-1 px-1 text-[11px] text-slate-400', isUser ? 'text-right' : 'text-left')}>
          {formatMessageTime(message.timestamp)}
        </p>
      </div>

      {isUser && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm">
          You
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
