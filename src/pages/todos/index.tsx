import { fetchTodos, type I_TODO } from '@api';
import { Todos } from '@components';
import { createElement as el, useEffect, useState } from '@core';

function PageTodos() {
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [todos, setTodos] = useState<I_TODO[]>([]);

  useEffect(() => {
    setIsError(false);
    setIsLoading(true);

    fetchTodos()
      .then((res) => {
        if (!res.ok) {
          setIsError(true);

          return;
        }

        return res.json();
      })
      .then((_todos) => {
        if (_todos) {
          setTodos(_todos);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isError) {
    return el('article', { className: 'todos-page' }, 'Error...');
  }

  if (isLoading) {
    return el('article', { className: 'todos-page' }, 'Loading...');
  }

  return el(Todos, {
    className: 'todos-page',
    todos,
  });
}

export { PageTodos };
