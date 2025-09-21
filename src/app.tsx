import { render } from '@core';
import { Page404 } from '@pages/not-found';
import { PageTodos } from '@pages/todos';
import { PageTodo } from '@pages/todos/slug';
import { HANDLERS, useRouter } from '@router';

function App() {
  const { handler } = useRouter();

  switch (handler) {
    case HANDLERS.TODOS:
      return <PageTodos />;

    case HANDLERS.TODO:
      return <PageTodo />;

    case HANDLERS.NOT_FOUND:
    default:
      break;
  }

  return <Page404 />;
}

render(<App />, document.getElementById('app')!);
