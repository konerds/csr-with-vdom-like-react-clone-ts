import { CONST_MODES_ROUTER } from './constants';
import {
  I_ROUTER,
  I_ROUTES,
  type T_MODES_ROUTER,
  type T_ON_ROUTE,
  type T_PARAMS_ON_ROUTE,
} from './interfaces';

class Router<H> {
  #routes: I_ROUTES<H>[];
  #onRoute: T_ON_ROUTE<H>;
  #mode: T_MODES_ROUTER;
  #listenerPopState: (_e: PopStateEvent) => void;
  #listenerHashChange: (_e: HashChangeEvent) => void;
  #isResolving = false;
  #isResolvingScheduled = false;

  constructor({
    mode = CONST_MODES_ROUTER.HISTORY,
    onRoute,
    routes,
  }: I_ROUTER<H> = {}) {
    this.#routes = routes || [];
    this.#onRoute = typeof onRoute === 'function' ? onRoute : () => {};
    this.#mode = mode;

    this.#listenerPopState = () => this.resolve();
    this.#listenerHashChange = () => this.resolve();

    if (this.#mode === CONST_MODES_ROUTER.HISTORY) {
      window.addEventListener('popstate', this.#listenerPopState);
    } else {
      window.addEventListener('hashchange', this.#listenerHashChange);
    }

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const elAnchor = target?.closest('a[data-link]');

      if (!elAnchor) {
        return;
      }

      const href = elAnchor.getAttribute('href');

      if (!href?.startsWith('/')) {
        return;
      }

      event.preventDefault();
      this.navigate(href);
    });
  }

  navigate(path: string, { replace = false }: { replace?: boolean } = {}) {
    let next: string;

    if (this.#mode === CONST_MODES_ROUTER.HASH) {
      if (
        (window.location.hash || '') ===
        (next = path.startsWith('/') ? `#${path}` : `#/${path}`)
      ) {
        return;
      }

      if (replace) {
        try {
          window.location.replace(
            window.location.href.replace(/#.*$/, '') + next
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);

          return;
        }

        return;
      }

      window.location.hash = next;

      return;
    }

    if (window.location.pathname + window.location.search === (next = path)) {
      return;
    }

    try {
      if (replace) {
        window.history.replaceState({}, '', next);
      } else {
        window.history.pushState({}, '', next);
      }

      this.#scheduleResolve();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  resolve() {
    if (this.#isResolving) {
      return;
    }

    this.#isResolving = true;

    try {
      const url = this.#currentURL();
      const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';
      const matched = this.#match(pathname);

      if (!matched) {
        return;
      }

      const { handler, params = {} } = matched;
      this.#onRoute(handler, params, this.#parseQuery(url), pathname);
    } finally {
      this.#isResolving = false;

      if (this.#isResolvingScheduled) {
        this.#isResolvingScheduled = false;

        queueMicrotask(() => this.resolve());
      }
    }
  }

  #currentURL() {
    return this.#mode === CONST_MODES_ROUTER.HASH
      ? new URL(
          (window.location.hash || '#/').slice(1) || '/',
          window.location.origin
        )
      : new URL(window.location.href);
  }

  #parseQuery(url: URL) {
    return Object.fromEntries(url.searchParams.entries());
  }

  #match(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    let fallback = null;

    for (const route of this.#routes) {
      const { handler, path } = route;

      if (path === '*') {
        fallback = { handler, params: {} };

        continue;
      }

      const parts = path.split('/').filter(Boolean);

      if (parts.length !== segments.length) {
        continue;
      }

      let isMatched = true;
      const params: T_PARAMS_ON_ROUTE = {};
      const szParts = parts.length;

      for (let i = 0; i < szParts; ++i) {
        const part = parts[i];
        const segment = segments[i];

        if (part.startsWith(':')) {
          params[part.slice(1)] = decodeURIComponent(segment);
          continue;
        }

        if (part !== segment) {
          isMatched = false;

          break;
        }
      }

      if (isMatched) {
        return { handler, params };
      }
    }

    return fallback;
  }

  #scheduleResolve() {
    if (this.#mode === CONST_MODES_ROUTER.HASH) {
      return;
    }

    if (this.#isResolving) {
      this.#isResolvingScheduled = true;

      return;
    }

    queueMicrotask(() => this.resolve());
  }
}

export { Router };
