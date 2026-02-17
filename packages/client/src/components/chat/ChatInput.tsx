import clsx from 'clsx';
import { FaArrowUp } from 'react-icons/fa';
import type { UseFormHandleSubmit, UseFormRegister } from 'react-hook-form';
import type { FormData } from './types';

type ChatInputProps = {
  loading: boolean;
  isValid: boolean;
  register: UseFormRegister<FormData>;
  handleSubmit: UseFormHandleSubmit<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
};

const ChatInput = ({ loading, isValid, register, handleSubmit, onSubmit }: ChatInputProps) => {
  const canSubmit = isValid && !loading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <textarea
        {...register('message', {
          required: true,
          validate: (value) => value.trim().length > 0,
        })}
        placeholder="Ask anything…"
        maxLength={500}
        className="min-h-[96px] w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 pr-16 text-sm leading-relaxed shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (canSubmit) {
              (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
            }
          }
        }}
        aria-label="Message input"
      />

      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Send message"
        className={clsx(
          'absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full text-sm text-white shadow-md transition',
          canSubmit
            ? 'bg-emerald-500 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2'
            : 'cursor-not-allowed bg-slate-300'
        )}
      >
        <FaArrowUp />
      </button>
    </form>
  );
};

export default ChatInput;
