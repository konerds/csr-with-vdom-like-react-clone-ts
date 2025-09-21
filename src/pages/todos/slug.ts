import { fetchTodo } from '@api';
import { Todo } from '@components';
import { Component, createElement as el } from '@core';

type T_PROPS = {
  route: string;
  params: {
    id?: string;
  };
};

type T_STATE = {
  isError: boolean;
  isLoading: boolean;
  todo?: {
    id: string;
    text: string;
  };
};

class PageTodo extends Component<T_PROPS, T_STATE> {
  constructor(props: T_PROPS) {
    super(props);

    this.state = { isError: false, isLoading: true, todo: undefined };
  }

  componentDidMount() {
    const { id } = this.props.params;

    if (!id) {
      this.setState({ isError: true, isLoading: false, todo: undefined });

      return;
    }

    this.fetch(id);
  }

  componentDidUpdate(_prevProps: Readonly<T_PROPS>): void {
    const { id } = this.props.params;

    if (id === _prevProps.params.id) {
      return;
    }

    if (!id) {
      this.setState({ isError: true, isLoading: false, todo: undefined });

      return;
    }

    this.fetch(id);
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

  private fetch(id: string) {
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
}

export { PageTodo };
