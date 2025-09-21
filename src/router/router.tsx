import { Router, useEffect, useState } from '@core';

import { mode } from './configs';
import { HANDLERS, PATHS, ROUTES } from './contstants';
import type { T_HANDLER, T_OPTS_NAVIGATE } from './interfaces';

function useRouter() {
  const [router, setRouter] = useState<Router<T_HANDLER> | null>(null);
  const [handler, setHandler] = useState<T_HANDLER>(HANDLERS.BASE);
  const [params, setParams] = useState<Record<string, string>>({});
  const [query, setQuery] = useState<Record<string, string>>({});
  const [pathname, setPathname] = useState<string>(PATHS.BASE);

  useEffect(() => {
    if (router) {
      return;
    }

    const _router = new Router<T_HANDLER>({
      mode,
      onRoute: (_handler, _params, _query, _pathname) => {
        if (_handler === HANDLERS.BASE) {
          _router.navigate(PATHS.TODOS, { replace: true });

          return;
        }

        if (_handler === HANDLERS.NOT_FOUND && _pathname !== PATHS.NOT_FOUND) {
          _router.navigate(PATHS.NOT_FOUND, { replace: true });

          return;
        }

        if (pathname === _pathname) {
          return;
        }

        setHandler(_handler);
        setParams(_params);
        setPathname(_pathname);
        setQuery(_query);
      },
      routes: ROUTES,
    });

    setRouter(_router);
    _router.resolve();

    return () => {
      _router.destroy?.();
      setRouter(null);
    };
  }, [router]);

  const navigate = (to: string, opts?: T_OPTS_NAVIGATE) => {
    router?.navigate(to, opts ?? {});
  };

  return {
    handler,
    mode,
    navigate,
    params,
    pathname,
    query,
  };
}

export { useRouter };
