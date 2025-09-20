import { Component, createElement as el } from '@core';

interface I_PROPS_TODO {
  todo: {
    id: string;
    text: string;
  };
}

interface I_STATE_TODO {
  todo: I_PROPS_TODO['todo'];
}

class Todo extends Component<I_PROPS_TODO, I_STATE_TODO> {
  constructor(props: I_PROPS_TODO) {
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
