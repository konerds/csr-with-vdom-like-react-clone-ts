import { CONST_MODES_ROUTER, T_MODES_ROUTER } from '@core';

import { Router } from '../core/router/router.js';
import { Component } from '../core/spa/component.js';
import { CONST_TYPE_FRAGMENT, createElement as el } from '../core/spa/vdom.js';
import { Page404 } from '../pages/not-found.js';
import { PageTodos } from '../pages/todos/index.js';
import { PageTodo } from '../pages/todos/slug.js';

const HANDLERS = Object.freeze({
  BASE: 'base',
  NOT_FOUND: 'not-found',
  TODO: 'todo',
  TODOS: 'todos',
});
const PATHS = Object.freeze({
  BASE: '/',
  NOT_FOUND: '/404',
  TODO: '/todos/:id',
  TODOS: '/todos',
});
const ROUTES = [
  { handler: HANDLERS.BASE, path: PATHS.BASE },
  { handler: HANDLERS.TODO, path: PATHS.TODO },
  { handler: HANDLERS.TODOS, path: PATHS.TODOS },
  { handler: HANDLERS.NOT_FOUND, path: PATHS.NOT_FOUND },
  { handler: HANDLERS.NOT_FOUND, path: '*' },
];

interface I_PROPS_PROVIDER_ROUTER {
  mode?: string;
}

interface I_STATE_PROVIDER_ROUTER {
  params: Record<string, string>;
  pathname: string;
  query: Record<string, string>;
  route: string;
}

class ProviderRouter extends Component<
  I_PROPS_PROVIDER_ROUTER,
  I_STATE_PROVIDER_ROUTER
> {
  router?: any;

  constructor(props: I_PROPS_PROVIDER_ROUTER) {
    super(props);

    this.state = {
      params: {},
      pathname: PATHS.BASE,
      query: {},
      route: HANDLERS.BASE,
    };
  }

  componentDidMount() {
    const { mode = CONST_MODES_ROUTER.HISTORY } = this.props;

    const navigate = (to: string) => {
      if (window.location.pathname + window.location.search === to) {
        return;
      }

      this.router?.navigate(to, { replace: true });
    };

    this.router = new Router({
      mode: mode as T_MODES_ROUTER,
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
