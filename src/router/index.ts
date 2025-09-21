import {
  Component,
  CONST_TYPE_FRAGMENT,
  createElement as el,
  Router,
} from '@core';
import { Page404 } from '@pages/not-found';
import { PageTodos } from '@pages/todos';
import { PageTodo } from '@pages/todos/slug';

import { mode } from './configs.js';
import { HANDLERS, PATHS, ROUTES } from './contstants.js';

type T_PROPS = Record<string, unknown>;

type T_STATE = {
  params: Record<string, string>;
  pathname: string;
  query: Record<string, string>;
  route: string;
};

class ProviderRouter extends Component<T_PROPS, T_STATE> {
  router?: any;

  constructor() {
    super();

    this.state = {
      params: {},
      pathname: PATHS.BASE,
      query: {},
      route: HANDLERS.BASE,
    };
  }

  componentDidMount() {
    const navigate = (to: string) => {
      if (window.location.pathname + window.location.search === to) {
        return;
      }

      this.router?.navigate(to, { replace: true });
    };

    this.router = new Router({
      mode,
      onRoute: (handler, params, query, pathname) => {
        if (handler === HANDLERS.NOT_FOUND && pathname !== PATHS.NOT_FOUND) {
          navigate(PATHS.NOT_FOUND);

          return;
        }

        if (handler === HANDLERS.TODO && !params?.id) {
          navigate(PATHS.NOT_FOUND);

          return;
        }

        if (handler === HANDLERS.BASE) {
          navigate(PATHS.TODOS);

          return;
        }

        this.setState({ params, pathname, query, route: handler });
      },
      routes: ROUTES,
    });

    this.router.resolve();
  }

  unmount() {
    if (typeof this.router?.destroy === 'function') {
      this.router.destroy();
    }

    this.router = null;

    super.unmount();
  }

  render() {
    const { params, pathname, query, route } = this.state;

    const propsDefault = {
      navigate: (to: string, opts?: any) => this.router?.navigate(to, opts),
      params,
      pathname,
      query,
      route,
    };

    let elPage = null;

    switch (route) {
      case HANDLERS.BASE:
        elPage = CONST_TYPE_FRAGMENT;

        break;

      case HANDLERS.TODOS:
        elPage = PageTodos;

        break;

      case HANDLERS.TODO:
        elPage = PageTodo;

        break;

      case HANDLERS.NOT_FOUND:
      default:
        elPage = Page404;

        break;
    }

    return el(elPage, {
      ...propsDefault,
    });
  }
}

export { ProviderRouter };
