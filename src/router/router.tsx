import {
  CONST_MODES_ROUTER,
  Router,
  useCallback,
  useLayoutEffect,
  useState,
} from '@core';

import { mode } from './configs';
import { CONST_HANDLERS, CONST_PATHS, CONST_ROUTES } from './constants';
import type {
  T_HANDLER,
  T_LISTENER_ROUTER,
  T_OPTS_NAVIGATE,
  T_STATE_ROUTER,
} from './interfaces';

let routerSingleton: Router<T_HANDLER> | null = null;

let _snapshot: T_STATE_ROUTER | null = null;

function getSnapshot() {
  return _snapshot;
}

const listeners = new Set<T_LISTENER_ROUTER>();

function emit(stateRouter: T_STATE_ROUTER) {
  _snapshot = stateRouter;

  for (const listener of listeners) {
    listener(stateRouter);
  }
}

function ensureRouter() {
  if (routerSingleton) {
    return routerSingleton;
  }

  routerSingleton = new Router<T_HANDLER>({
    mode,
    onRoute: (handler, params, query, pathname) => {
      if (handler === CONST_HANDLERS.NOT_FOUND) {
        routerSingleton!.navigate(CONST_PATHS.NOT_FOUND, { replace: true });

        return;
      }

      if (handler === CONST_HANDLERS.BASE) {
        routerSingleton!.navigate(CONST_PATHS.TODOS, { replace: true });

        return;
      }

      emit({ handler, params, pathname, query });
    },
    routes: CONST_ROUTES,
  });

  if (mode === CONST_MODES_ROUTER.HASH && !window.location.hash) {
    routerSingleton.navigate(
      window.location.pathname + window.location.search || '/',
      { replace: true }
    );
  }

  routerSingleton.requestResolve();

  return routerSingleton;
}

function useRouter() {
  const router = ensureRouter();

  const snapshot = getSnapshot();

  const [handler, setHandler] = useState<T_HANDLER>(
    snapshot?.handler ?? CONST_HANDLERS.BASE
  );
  const [params, setParams] = useState<Record<string, string>>(
    snapshot?.params ?? {}
  );
  const [query, setQuery] = useState<Record<string, string>>(
    snapshot?.query ?? {}
  );
  const [pathname, setPathname] = useState<string>(
    snapshot?.pathname ?? CONST_PATHS.BASE
  );

  useLayoutEffect(() => {
    const listener: T_LISTENER_ROUTER = ({
      handler: _handler,
      params: _params,
      pathname: _pathname,
      query: _query,
    }) => {
      setHandler(_handler);
      setParams(_params);
      setQuery(_query);
      setPathname(_pathname);
    };

    listeners.add(listener);

    if (snapshot) {
      listener(snapshot);
    } else {
      router.requestResolve();
    }

    return () => {
      listeners.delete(listener);
    };
  }, [router]);
  const navigate = useCallback(
    (to: string, opts?: T_OPTS_NAVIGATE) => {
      router.navigate(to, opts);
    },
    [router]
  );

  return { handler, navigate, params, pathname, query };
}

export { useRouter };
