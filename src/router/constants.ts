const CONST_HANDLERS = Object.freeze({
  BASE: 'base',
  NOT_FOUND: 'not-found',
  TODO: 'todo',
  TODOS: 'todos',
});
const CONST_PATHS = Object.freeze({
  BASE: '/',
  NOT_FOUND: '/404',
  TODO: '/todos/:id',
  TODOS: '/todos',
});
const CONST_ROUTES = [
  { handler: CONST_HANDLERS.BASE, path: CONST_PATHS.BASE },
  { handler: CONST_HANDLERS.TODO, path: CONST_PATHS.TODO },
  { handler: CONST_HANDLERS.TODOS, path: CONST_PATHS.TODOS },
  { handler: CONST_HANDLERS.NOT_FOUND, path: CONST_PATHS.NOT_FOUND },
  { handler: CONST_HANDLERS.NOT_FOUND, path: '*' },
];

export { CONST_HANDLERS, CONST_PATHS, CONST_ROUTES };
