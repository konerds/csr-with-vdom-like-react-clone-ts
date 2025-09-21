import type { I_TODO } from './interfaces';

const TODOS: I_TODO[] = [
  { id: '1', text: 'Learn Typescript' },
  { id: '2', text: 'Learn ES6' },
  { id: '3', text: 'Learn Virtual DOM' },
  { id: '4', text: 'Learn React Router' },
  { id: '5', text: 'Learn Store with Flux Architecture' },
];

async function fetchTodos() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        json: async () => {
          return TODOS;
        },
        ok: true,
      });
    }, 500);
  }) as Promise<{
    json: () => Promise<I_TODO[]>;
    ok: boolean;
  }>;
}

async function fetchTodo(id: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        json: async () => {
          return TODOS.find((t) => t.id === id);
        },
        ok: true,
      });
    }, 500);
  }) as Promise<{
    json: () => Promise<I_TODO | undefined>;
    ok: boolean;
  }>;
}

export { fetchTodo, fetchTodos };
