import { HANDLERS } from './contstants';

type T_HANDLER = (typeof HANDLERS)[keyof typeof HANDLERS];
type T_OPTS_NAVIGATE = { replace?: boolean };
type T_STATE_ROUTER = {
  handler: T_HANDLER;
  params: Record<string, string>;
  query: Record<string, string>;
  pathname: string;
};
type T_LISTENER_ROUTER = (_args: T_STATE_ROUTER) => void;

export type { T_HANDLER, T_LISTENER_ROUTER, T_OPTS_NAVIGATE, T_STATE_ROUTER };
