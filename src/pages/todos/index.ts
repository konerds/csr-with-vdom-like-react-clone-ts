import { fetchTodos } from '@api';
import { Todos } from '@components';
import { Component, createElement as el } from '@core';

interface I_PROPS_PAGE_TODOS {
  route: string;
}

interface I_STATE_PAGE_TODOS {
  isError: boolean;
  isLoading: boolean;
  todos: {
    id: string;
    text: string;
  }[];
}

class PageTodos extends Component<I_PROPS_PAGE_TODOS, I_STATE_PAGE_TODOS> {
  constructor(props: I_PROPS_PAGE_TODOS) {
    super(props);

    this.state = { isError: false, isLoading: true, todos: [] };
  }

  componentDidMount() {
    this.setState({ isError: false, isLoading: true });

    fetchTodos()
      .then((res) => {
        if (!res.ok) {
          this.setState({ isError: true });

          return;
        }

        return res.json();
      })
      .then((todos) => {
        this.setState({ todos });
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
      return el('article', { className: `${route}-page` }, 'Error...');
    }

    if (this.state.isLoading) {
      return el('article', { className: `${route}-page` }, 'Loading...');
    }

    const { todos } = this.state;

    return el(Todos, {
      className: `${route}-page`,
      todos,
    });
  }
}

export { PageTodos };
