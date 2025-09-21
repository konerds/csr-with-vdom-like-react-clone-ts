import { CONST_ACTION_INIT } from './constants';
import {
  type I_ACTION,
  type I_STORE,
  type T_ACTION,
  type T_LISTENER,
  type T_REDUCER,
  type T_STATE,
} from './interfaces';

function createStore<S, A extends I_ACTION>(
  reducer: T_REDUCER<S, A>,
  statePreloaded?: S
): I_STORE<S, A> {
  let state: S =
    statePreloaded === undefined
      ? reducer(undefined, { type: CONST_ACTION_INIT } as A)
      : statePreloaded;
  const listeners = new Set<T_LISTENER>();

  function getState() {
    return state;
  }

  function subscribe(listener: T_LISTENER) {
    listeners.add(listener);

    return () => listeners.delete(listener);
  }

  function dispatch(action: A) {
    if (!action || typeof action.type === 'undefined') {
      throw new Error("Action must have 'type' property...");
    }

    state = reducer(state, action);

    for (const listener of listeners) {
      listener();
    }

    return action;
  }

  return { dispatch, getState, subscribe };
}

function combineReducers<V extends Record<string, T_REDUCER<any, any>>>(
  reducers: V
) {
  type S = T_STATE<V>;
  type A = T_ACTION<V>;

  return function root(state = {} as S, action: A) {
    const stateNext = {} as S;

    let isChanged = false;

    for (const key in reducers) {
      const statePrev = state[key];
      stateNext[key] = reducers[key](statePrev, action);

      if (stateNext[key] !== statePrev) {
        isChanged = true;
      }
    }

    return isChanged ? stateNext : state;
  };
}

export { combineReducers, createStore };
