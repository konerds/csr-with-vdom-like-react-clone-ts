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

export { HANDLERS, PATHS, ROUTES };
