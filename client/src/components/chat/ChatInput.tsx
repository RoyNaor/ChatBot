import { FaArrowUp } from 'react-icons/fa';
import clsx from 'clsx';
import type { UseFormRegister, UseFormHandleSubmit, FormState } from 'react-hook-form';
import type { ChatFormData } from './types';

type ChatInputProps = {
  loading: boolean;
  register: UseFormRegister<ChatFormData>;
  handleSubmit: UseFormHandleSubmit<ChatFormData>;
  onSubmit: (data: ChatFormData) => Promise<void>;
  formState: FormState<ChatFormData>;
};

export const ChatInput = ({ loading, register, handleSubmit, onSubmit, formState }: ChatInputProps) => (
  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
    <textarea
      {...register('message', {
        required: true,
        validate: (value) => value.trim().length > 0,
      })}
      placeholder="Ask anything…"
      maxLength={500}
      className="w-full min-h-[90px] resize-none rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          (event.currentTarget.form as HTMLFormElement)?.requestSubmit();
        }
      }}
    />

    <div className="flex justify-end">
      <button
        type="submit"
        disabled={!formState.isValid || loading}
        className={clsx(
          'w-10 h-10 rounded-full grid place-items-center transition',
          formState.isValid && !loading ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-slate-300 cursor-not-allowed'
        )}
      >
        <FaArrowUp />
      </button>
    </div>
  </form>
);
