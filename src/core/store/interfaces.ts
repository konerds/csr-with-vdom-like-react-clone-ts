interface I_ACTION<T = string> {
  type: T;
}

type T_REDUCER<S, A extends I_ACTION = I_ACTION> = (
  _state: S | undefined,
  _action: A
) => S;

type T_ACTION<V> = V[keyof V] extends T_REDUCER<any, infer A> ? A : never;

type T_STATE<V> = {
  [K in keyof V]: V[K] extends T_REDUCER<infer S, any> ? S : never;
};

type T_LISTENER = () => void;

type T_UNSUBSCRIBE = () => boolean;

interface I_STORE<S, A extends I_ACTION = I_ACTION> {
  getState(): S;
  dispatch(_action: A): A;
  subscribe(_listener: T_LISTENER): T_UNSUBSCRIBE;
}

export {
  I_ACTION,
  I_STORE,
  T_ACTION,
  T_LISTENER,
  T_REDUCER,
  T_STATE,
  T_UNSUBSCRIBE,
};
