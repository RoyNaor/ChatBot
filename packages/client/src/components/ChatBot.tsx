import { Button } from './ui/button';
import { FaArrowUp } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useRef } from 'react';

type FormData = {
  message: string;
};

const ChatBot = () => {
  const conversationId = useRef(crypto.randomUUID);
  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    mode: 'onChange',
  });

  const onSubmit = async ({ message }: FormData) => {
    const data = await axios.post('/api/chat', {
      message,
      conversationId: conversationId.current,
    });

    console.log(data);

    reset();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-2 items-end border-2 p-4 rounded-3xl"
    >
      <textarea
        {...register('message', {
          required: true,
          validate: (value) => value.trim().length > 0,
        })}
        className="w-full h-32 p-2 border-0 focus:outline-0 resize-none"
        placeholder="Ask anything..."
        maxLength={500}
      />
      <Button
        disabled={!formState.isValid}
        className="rounded-full p-2 w-9 h-9"
      >
        <FaArrowUp />
      </Button>
    </form>
  );
};

export default ChatBot;
