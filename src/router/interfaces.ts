import { HANDLERS } from './contstants';

type T_HANDLER = (typeof HANDLERS)[keyof typeof HANDLERS];
type T_OPTS_NAVIGATE = { replace?: boolean };

export type { T_HANDLER, T_OPTS_NAVIGATE };
