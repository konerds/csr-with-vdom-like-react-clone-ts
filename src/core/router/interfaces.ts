import { CONST_MODES_ROUTER, CONST_MODES_SCHEDULING } from './constants';

type T_MODES_SCHEDULING =
  (typeof CONST_MODES_SCHEDULING)[keyof typeof CONST_MODES_SCHEDULING];

type T_MODES_ROUTER =
  (typeof CONST_MODES_ROUTER)[keyof typeof CONST_MODES_ROUTER];

type T_PARAMS_ON_ROUTE = Record<string, string>;

type T_QUERY_ON_ROUTE = Record<string, string>;

type T_ON_ROUTE<H = unknown> = (
  _handler: H,
  _params: T_PARAMS_ON_ROUTE,
  _query: T_QUERY_ON_ROUTE,
  _pathname: string
) => void;

interface I_ROUTER<H> {
  mode?: T_MODES_ROUTER;
  onRoute?: T_ON_ROUTE<H>;
  routes?: I_ROUTES<H>[];
}

interface I_ROUTES<H> {
  path: string;
  handler: H;
}

export type {
  I_ROUTER,
  I_ROUTES,
  T_MODES_ROUTER,
  T_MODES_SCHEDULING,
  T_ON_ROUTE,
  T_PARAMS_ON_ROUTE,
};
