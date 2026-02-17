export const TypingIndicator = () => (
  <div className="flex gap-3 items-end">
    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white grid place-items-center text-sm">🤖</div>
    <div className="px-4 py-2 rounded-2xl bg-indigo-100 text-indigo-900 text-sm animate-pulse">typing…</div>
  </div>
);
