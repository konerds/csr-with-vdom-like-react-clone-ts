import { fetchTodo, type I_TODO } from '@api';
import { Todo } from '@components';
import { createElement as el, useLayoutEffect, useState } from '@core';
import { useRouter } from '@router';

function PageTodo() {
  const { params } = useRouter();

  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todo, setTodo] = useState<I_TODO | undefined>(undefined);

  useLayoutEffect(() => {
    if (!params?.id) {
      setIsError(true);
      setIsLoading(false);
      setTodo(undefined);

      return;
    }

    setIsError(false);
    setIsLoading(true);

    fetchTodo(params.id)
      .then((res) => {
        if (!res.ok) {
          setIsError(true);

          return;
        }

        return res.json();
      })
      .then((todo) => {
        setTodo(todo);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params?.id]);

  if (isError) {
    return el('section', { className: 'todo-page' }, 'Error...');
  }

  if (isLoading) {
    return el('section', { className: 'todo-page' }, 'Loading...');
  }

  if (!todo?.id) {
    return el('section', { className: 'todo-page' }, 'No Data...');
  }

  return el(Todo, {
    className: 'todo-page',
    todo,
  });
}

export { PageTodo };
