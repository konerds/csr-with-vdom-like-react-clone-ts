import type { I_TODO } from '@api';
import { Component, createElement as el } from '@core';

type T_PROPS = {
  todo: I_TODO;
};

class Todo extends Component<T_PROPS> {
  render() {
    const { todo } = this.props;

    return el(
      'div',
      { className: 'todo-item' },
      el('span', { className: 'todo-item__text' }, todo.text)
    );
  }
}

export { Todo };
