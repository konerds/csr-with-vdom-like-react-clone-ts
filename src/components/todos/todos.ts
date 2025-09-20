import { Component, createElement as el } from '@core';

import { Todo } from './todo';

interface I_PROPS_TODOS {
  todos: {
    id: string;
    text: string;
  }[];
}

class Todos extends Component<I_PROPS_TODOS> {
  constructor(props: I_PROPS_TODOS) {
    super(props);
  }

  render() {
    const { todos } = this.props;

    if (!todos?.length) {
      return el('article', {}, 'No Todos...');
    }

    return el(
      'article',
      { className: 'todos' },
      el(
        'ul',
        { className: 'todos__list' },
        todos.map((todo) => el('li', { key: todo.id }, el(Todo, { todo })))
      )
    );
  }
}

export { Todos };
