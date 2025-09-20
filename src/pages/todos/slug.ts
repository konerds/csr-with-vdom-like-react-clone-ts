import { fetchTodo } from '@api';
import { Todo } from '@components';
import { Component, createElement as el } from '@core';

interface I_PROPS_PAGE_TODO {
  route: string;
  params: {
    id: string;
  };
}

interface I_STATE_PAGE_TODO {
  isError: boolean;
  isLoading: boolean;
  todo?: {
    id: string;
    text: string;
  };
}

class PageTodo extends Component<I_PROPS_PAGE_TODO, I_STATE_PAGE_TODO> {
  constructor(props: I_PROPS_PAGE_TODO) {
    super(props);

    this.state = { isError: false, isLoading: true, todo: undefined };
  }

  componentDidMount() {
    const { id } = this.props.params;

    this.setState({ isError: false, isLoading: true });

    fetchTodo(id)
      .then((res) => {
        if (!res.ok) {
          this.setState({ isError: true });

          return;
        }

        return res.json();
      })
      .then((todo) => {
        this.setState({ todo });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        this.setState({ isError: true });
      })
      .finally(() => {
        this.setState({ isLoading: false });
      });
  }

  render() {
    const { route } = this.props;

    if (this.state.isError) {
      return el('section', { className: `${route}-page` }, 'Error...');
    }

    if (this.state.isLoading) {
      return el('section', { className: `${route}-page` }, 'Loading...');
    }

    if (!this.state.todo?.id) {
      return el('section', { className: `${route}-page` }, 'No Data...');
    }

    const { todo } = this.state;

    return el(Todo, { className: `${route}-page`, todo });
  }
}

export { PageTodo };
