import { CONST_MODES_ROUTER } from './constants';
import type {
  I_ROUTER,
  I_ROUTES,
  T_MODES_ROUTER,
  T_ON_ROUTE,
  T_PARAMS_ON_ROUTE,
} from './interfaces';

class Router<H> {
  #routes: I_ROUTES<H>[];
  #onRoute: T_ON_ROUTE<H>;
  #mode: T_MODES_ROUTER;
  #listenerPopState: (_e: PopStateEvent) => void;
  #listenerHashChange: (_e: HashChangeEvent) => void;
  #listenerDocumentClick: (_e: MouseEvent) => void;
  #isResolving = false;
  #isResolvingScheduled = false;
  #rerunAfterResolve = false;
  #isDestroyed = false;

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
    this.#listenerDocumentClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const elAnchor = target?.closest<HTMLAnchorElement>('a[data-link]');

      if (!elAnchor) {
        return;
      }

      const href = elAnchor.getAttribute('href');

      if (!href?.startsWith('/')) {
        return;
      }

      event.preventDefault();
      this.navigate(href);
    };

    if (this.#mode === CONST_MODES_ROUTER.HISTORY) {
      window.addEventListener('popstate', this.#listenerPopState);
    } else {
      window.addEventListener('hashchange', this.#listenerHashChange);
    }

    document.addEventListener('click', this.#listenerDocumentClick);
  }

  navigate(path: string, { replace = false }: { replace?: boolean } = {}) {
    if (this.#isDestroyed) {
      return;
    }

    let next: string;

    if (this.#mode === CONST_MODES_ROUTER.HASH) {
      next = path.startsWith('/') ? `#${path}` : `#/${path}`;

      if ((window.location.hash || '') === next) {
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

    next = path;

    if (window.location.pathname + window.location.search === next) {
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

  #lastResolvedKey: string | null = null;

  resolve() {
    if (this.#isDestroyed) {
      return;
    }

    if (this.#isResolving) {
      this.#rerunAfterResolve = true;

      return;
    }

    this.#isResolving = true;

    try {
      const url = this.#currentURL();
      const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';
      const keyCurrent = `${pathname}?${url.search || ''}`;

      if (this.#lastResolvedKey === keyCurrent) {
        return;
      }

      this.#lastResolvedKey = keyCurrent;
      const matched = this.#match(pathname);

      if (!matched) {
        return;
      }

      const { handler, params = {} } = matched;
      this.#onRoute(handler, params, this.#parseQuery(url), pathname);
    } finally {
      this.#isResolving = false;

      if (!this.#rerunAfterResolve || this.#isDestroyed) {
        return;
      }

      this.#rerunAfterResolve = false;
      this.#scheduleResolve();
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
    let fallback: { handler: H; params: T_PARAMS_ON_ROUTE } | null = null;

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
    if (this.#isDestroyed || this.#mode === CONST_MODES_ROUTER.HASH) {
      return;
    }

    if (this.#isResolving) {
      this.#rerunAfterResolve = true;

      return;
    }

    if (this.#isResolvingScheduled) {
      return;
    }

    this.#isResolvingScheduled = true;

    queueMicrotask(() => {
      this.#isResolvingScheduled = false;
      this.resolve();
    });
  }

  destroy() {
    if (this.#isDestroyed) {
      return;
    }

    this.#isDestroyed = true;

    if (this.#mode === CONST_MODES_ROUTER.HISTORY) {
      window.removeEventListener('popstate', this.#listenerPopState);
    } else {
      window.removeEventListener('hashchange', this.#listenerHashChange);
    }

    document.removeEventListener('click', this.#listenerDocumentClick);
    this.#isResolving = false;
    this.#isResolvingScheduled = false;
    this.#onRoute = (() => {}) as T_ON_ROUTE<H>;
    this.#routes = [];
  }
}

export { Router };
