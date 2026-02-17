import concurrent from 'concurrently';

concurrent([
  {
    name: 'server',
    command: 'bun run dev',
    cwd: 'server',
    prefixColor: 'red',
  },
  {
    name: 'client',
    command: 'bun run dev',
    cwd: 'client',
    prefixColor: 'green',
  },
]);
