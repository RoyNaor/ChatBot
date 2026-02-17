import clsx from 'clsx';
import { isRtlText } from './utils';
import type { ChatMessage } from './types';

type MessageProps = {
  message: ChatMessage;
};

export const Message = ({ message }: MessageProps) => {
  const isUser = message.role === 'user';
  const textDirection = isRtlText(message.content) ? 'rtl' : 'ltr';

  return (
    <div className={clsx('flex gap-3 items-end', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">
          🤖
        </div>
      )}

      <div className="max-w-[78%]">
        <div
          dir={textDirection}
          className={clsx(
            'px-4 py-2 rounded-2xl text-sm leading-snug shadow-sm',
            'text-start',
            isUser ? 'bg-emerald-300 text-emerald-950 rounded-br-md' : 'bg-indigo-100 text-indigo-950 rounded-bl-md'
          )}
          style={{ unicodeBidi: 'plaintext' }}
        >
          {message.content}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</div>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-full border grid place-items-center text-xs font-medium">
          You
        </div>
      )}
    </div>
  );
};
