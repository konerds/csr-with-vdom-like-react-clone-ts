import {
  createElement,
  type I_VNODE,
  render,
  type T_CREATE_ELEMENT,
} from './vdom';

type T_PATCH<S> = Partial<S> | ((_prev: Readonly<S>) => Partial<S>);

type T_UPDATER = () => void;

type T_CONTAINER = Element | DocumentFragment;

type T_RENDER = (_vnode: I_VNODE, _container: T_CONTAINER) => void;
abstract class Component<
  P extends object = Record<string, unknown>,
  S extends object = Record<string, unknown>,
> {
  __updater?: T_UPDATER;
  containerRef: T_CONTAINER | null = null;
  isMounted: boolean = false;
  readonly props: Readonly<P>;
  state!: S;

  constructor(props?: P) {
    this.props = (props ?? ({} as P)) as Readonly<P>;
  }

  componentDidMount?(): void;

  componentDidUpdate?(_prevProps: Readonly<P>, _prevState: Readonly<S>): void;

  mount(container: T_CONTAINER) {
    this.containerRef = container;
    this.isMounted = true;
    this.updateInternal();

    if (typeof this.componentDidMount === 'function') {
      queueMicrotask(() => this.componentDidMount!());
    }
  }

  abstract render(_createElement: T_CREATE_ELEMENT): I_VNODE;

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

  unmount() {
    this.isMounted = false;
    this.containerRef = null;
  }

  updateInternal() {
    if (typeof this.__updater === 'function') {
      this.__updater();

      return;
    }

    if (!this.isMounted || !this.containerRef) {
      return;
    }

    const vnode = this.render(createElement as T_CREATE_ELEMENT);
    const nextProps = vnode.props ? { ...vnode.props } : {};
    (nextProps as any)['data-component'] = this.constructor.name;
    (render as T_RENDER)(
      { ...(vnode as any), props: nextProps } as I_VNODE,
      this.containerRef
    );
  }
}

export { Component };
