import type { I_TODO } from '@api';
import { Component, createElement as el } from '@core';

type T_PROPS = {
  todo: I_TODO;
};

type T_STATE = {
  todo: I_TODO;
};

class Todo extends Component<T_PROPS, T_STATE> {
  constructor(props: T_PROPS) {
    super(props);

    const { todo } = props;
    this.state = { todo };
  }

  componentDidMount() {
    // eslint-disable-next-line no-console
    console.log(this.state.todo);
  }

  render() {
    return el(
      'div',
      { className: 'todo-item' },
      el('span', { className: 'todo-item__text' }, this.state.todo.text)
    );
  }
}

export { Todo };
