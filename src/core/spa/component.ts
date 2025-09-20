import { createElement, render } from './vdom';

type T_PATCH<S> = Partial<S> | ((_prev: Readonly<S>) => Partial<S>);

type T_UPDATER = () => void;

type T_CONTAINER = Element | DocumentFragment;

interface I_VNODE<P = Record<string, unknown>> {
  type: unknown;
  props?: P & Record<string, unknown>;
  children?: unknown;
}

type T_RENDER = (_vnode: I_VNODE, _container: T_CONTAINER) => void;

type T_CREATE_ELEMENT = (
  _type: unknown,
  _props?: Record<string, unknown> | null,
  ..._children: unknown[]
) => I_VNODE;

abstract class Component<
  P extends object = Record<string, unknown>,
  S extends object = Record<string, unknown>,
> {
  readonly props: Readonly<P>;
  state!: S;
  isMounted: boolean = false;
  containerRef: T_CONTAINER | null = null;
  __updater?: T_UPDATER;

  componentDidMount?(): void;

  constructor(props?: P) {
    this.props = (props ?? ({} as P)) as Readonly<P>;
  }

  setState(patch: T_PATCH<S>) {
    const prev = (this.state ?? ({} as S)) as Readonly<S>;

    this.state = {
      ...(prev as object),
      ...((typeof patch === 'function' ? patch(prev) : patch) as object),
    } as S;

    if (typeof this.__updater === 'function') {
      this.__updater();

      return;
    }

    this.updateInternal();
  }

  mount(container: T_CONTAINER) {
    this.containerRef = container;
    this.isMounted = true;
    this.updateInternal();

    if (typeof this.componentDidMount === 'function') {
      queueMicrotask(() => this.componentDidMount!());
    }
  }

  unmount() {
    this.isMounted = false;
    this.containerRef = null;
  }

  abstract render(_createElement: T_CREATE_ELEMENT): I_VNODE;

  updateInternal() {
    if (typeof this.__updater === 'function') {
      this.__updater();

      return;
    }

    if (!this.isMounted || !this.containerRef) {
      return;
    }

    const vnode = this.render(createElement as T_CREATE_ELEMENT);
    vnode.props = vnode.props || {};
    vnode.props['data-component'] = this.constructor.name;
    (render as T_RENDER)(vnode as I_VNODE, this.containerRef);
  }
}

export { Component, T_CREATE_ELEMENT };
