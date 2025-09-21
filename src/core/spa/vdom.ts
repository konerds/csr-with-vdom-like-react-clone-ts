import { type T_CREATE_ELEMENT } from './component';
import { CONST_TYPE_FRAGMENT, CONST_TYPE_TEXT } from './constants';

interface I_IDLE_DEADLINE {
  didTimeout: boolean;
  timeRemaining(): number;
}

type T_REQUEST_IDLE_CALLBACK = (
  _cb: (_deadline: I_IDLE_DEADLINE) => void
) => number;

type T_EVENT_LISTENER_MAP = Record<string, EventListener>;

type T_ANY_PROPS = Record<string, any>;

interface I_VNODE {
  type: T_VNODE_TYPE;
  props?: I_PROPS;
}

interface I_PROPS extends T_ANY_PROPS {
  children?: I_VNODE[];
  nodeValue?: string;
  ref?:
    | ((_el: HTMLElement | Text | null) => void)
    | { current?: HTMLElement | Text | null };
}

type T_FUNCTION_COMPONENT<P extends I_PROPS = I_PROPS> = (_props: P) => I_VNODE;

interface I_CLASS_COMPONENT_INSTANCE<P extends I_PROPS = I_PROPS> {
  props: P;
  render(_createElement: T_CREATE_ELEMENT): I_VNODE;
  componentDidMount?(): void;
  componentDidUpdate?(_prevProps: Readonly<P>, _prevState: Readonly<any>): void;
  __updater?: () => void;
}

type T_HOST_TYPE = string;

type T_SPECIAL_TYPE = typeof CONST_TYPE_TEXT | typeof CONST_TYPE_FRAGMENT;

type T_VNODE_TYPE =
  | T_HOST_TYPE
  | T_SPECIAL_TYPE
  | T_FUNCTION_COMPONENT<any>
  | I_CLASS_COMPONENT_CONSTRUCTOR<any>;

interface I_CLASS_COMPONENT_CONSTRUCTOR<P extends I_PROPS = I_PROPS> {
  new (_props: P): I_CLASS_COMPONENT_INSTANCE<P>;
  prototype: {
    render: (_createElement: T_CREATE_ELEMENT) => I_VNODE;
  };
}

type T_EFFECT_TAG = 'PLACEMENT' | 'UPDATE' | 'DELETION';

interface I_HOOK_STATE<S = any> {
  state: S;
  queue: Array<S | ((_prev: S) => S)>;
}

interface I_HOOK_EFFECT {
  tag: 'layout' | 'effect';
  create?: () => void | (() => void);
  cleanup?: (() => void) | undefined;
  deps?: any[] | undefined;
}

type T_HOOK = I_HOOK_STATE | I_HOOK_EFFECT;

interface I_FIBER {
  type: T_VNODE_TYPE;
  props?: I_PROPS;
  dom?: Node | null;
  parent?: I_FIBER | null;
  child?: I_FIBER | null;
  sibling?: I_FIBER | null;
  alternate?: I_FIBER | null;
  effectTag?: T_EFFECT_TAG;
  stateNode?: I_CLASS_COMPONENT_INSTANCE<any>;
  hooks?: T_HOOK[];
}

interface I_CONTAINER_WITH_VNODE extends HTMLElement {
  __vnode?: I_VNODE;
}

interface I_HTML_WITH_LISTENERS extends HTMLElement {
  __listeners?: T_EVENT_LISTENER_MAP;
}

interface I_PENDINGS {
  fiber: I_FIBER;
  hook: I_HOOK_EFFECT;
}

const polyfillRequestIdleCallback: T_REQUEST_IDLE_CALLBACK =
  typeof requestIdleCallback === 'function'
    ? (cb) => requestIdleCallback(cb)
    : (cb) =>
        setTimeout(
          () => cb({ didTimeout: true, timeRemaining: () => 0 }),
          1
        ) as unknown as number;

function isTypeClassComponent(
  t: unknown
): t is I_CLASS_COMPONENT_CONSTRUCTOR<any> {
  return (
    typeof t === 'function' &&
    typeof (t as any)?.prototype?.render === 'function'
  );
}

function setProp(dom: I_HTML_WITH_LISTENERS | Text, name: string, value: any) {
  if (dom.nodeType === Node.TEXT_NODE) {
    return;
  }

  dom = dom as I_HTML_WITH_LISTENERS;

  if (name === 'className') {
    if (value == null || value === false) {
      dom.removeAttribute('class');

      return;
    }

    dom.setAttribute('class', value);

    return;
  }

  if (name.startsWith('on') && (typeof value === 'function' || value == null)) {
    const nameEvent = name.slice(2).toLowerCase();
    dom.__listeners = dom.__listeners || {};

    if (dom.__listeners[nameEvent]) {
      dom.removeEventListener(nameEvent, dom.__listeners[nameEvent]);
      delete dom.__listeners[nameEvent];
    }

    if (typeof value === 'function') {
      dom.addEventListener(nameEvent, value);
      dom.__listeners[nameEvent] = value;
    }

    return;
  }

  if (name === 'style' && typeof value === 'object') {
    dom.removeAttribute('style');
    Object.assign((dom as HTMLElement).style, value || {});

    return;
  }

  if (name === 'ref') {
    if (typeof value === 'function') {
      value(dom || null);
    } else if (value && typeof value === 'object') {
      (value as any).current = dom || null;
    }

    return;
  }

  if (value === false || value === null || value === undefined) {
    dom.removeAttribute(name);

    return;
  }

  dom.setAttribute(name, value === true ? '' : String(value));
}

function updateDom(
  dom: Text | I_HTML_WITH_LISTENERS,
  propsPrev: I_PROPS | undefined,
  propsNext: I_PROPS | undefined,
  type: string
) {
  if (type === CONST_TYPE_TEXT) {
    const nodeValue = propsNext?.nodeValue;

    if (propsPrev?.nodeValue !== nodeValue) {
      (dom as Text).nodeValue = nodeValue ?? '';
    }

    return;
  }

  const listBypass = new Set(['children', 'nodeValue', 'key']);
  const keys = new Set<string>([
    ...Object.keys(propsPrev || {}),
    ...Object.keys(propsNext || {}),
  ]);

  for (const k of keys) {
    if (listBypass.has(k)) {
      continue;
    }

    const valueNext = propsNext ? (propsNext as any)[k] : undefined;

    if ((propsPrev ? (propsPrev as any)[k] : undefined) === valueNext) {
      continue;
    }

    setProp(dom as I_HTML_WITH_LISTENERS, k, valueNext);
  }
}

function createElement(
  type: T_VNODE_TYPE,
  props: I_PROPS = {},
  ...children: (
    | I_VNODE
    | string
    | number
    | boolean
    | null
    | undefined
    | I_VNODE[]
  )[]
) {
  return {
    props: {
      ...(props || {}),
      children: children
        .flat()
        .filter(
          (c) => c !== null && c !== undefined && c !== false && c !== true
        )
        .map((c) =>
          typeof c === 'string' || typeof c === 'number'
            ? ({
                props: { nodeValue: String(c) } as I_PROPS,
                type: CONST_TYPE_TEXT,
              } as I_VNODE)
            : (c as I_VNODE)
        ),
    },
    type,
  } as I_VNODE;
}

let nextUnitOfWork: I_FIBER | null = null;
let wipRoot: I_FIBER | null = null;

function workLoop(deadline: I_IDLE_DEADLINE) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  polyfillRequestIdleCallback(workLoop);
}

polyfillRequestIdleCallback(workLoop);

function createDomFromFiber(fiber: I_FIBER) {
  if (fiber.type === CONST_TYPE_TEXT) {
    return document.createTextNode(fiber.props?.nodeValue || '');
  }

  if (fiber.type === CONST_TYPE_FRAGMENT) {
    return null;
  }

  if (typeof fiber.type === 'string') {
    const dom = document.createElement(fiber.type) as I_HTML_WITH_LISTENERS;
    updateDom(dom, {} as I_PROPS, fiber.props || {}, fiber.type);

    return dom;
  }

  return null;
}

let pendingsLayoutEffects: I_PENDINGS[] = [];

function flushLayoutEffects() {
  const runs = pendingsLayoutEffects;
  pendingsLayoutEffects = [];

  for (const { hook } of runs) {
    if (typeof hook.cleanup === 'function') {
      try {
        hook.cleanup();
      } catch {
        // ignore
      }

      hook.cleanup = undefined;
    }

    const r = typeof hook.create === 'function' ? hook.create() : undefined;
    hook.cleanup = typeof r === 'function' ? r : undefined;
  }
}

let pendingsPassiveEffects: I_PENDINGS[] = [];

function schedulePassiveEffectsFlush() {
  const runs = pendingsPassiveEffects;
  pendingsPassiveEffects = [];

  setTimeout(() => {
    for (const { hook } of runs) {
      if (typeof hook.cleanup === 'function') {
        try {
          hook.cleanup();
        } catch {
          // ignore
        }

        hook.cleanup = undefined;
      }

      const r = typeof hook.create === 'function' ? hook.create() : undefined;
      hook.cleanup = typeof r === 'function' ? r : undefined;
    }
  }, 0);
}

let deletions: I_FIBER[] = [];
let currentRoot: I_FIBER | null = null;

function commitRoot() {
  for (const deletion of deletions) {
    commitWork(deletion);
  }

  if (wipRoot) {
    commitWork(wipRoot.child);
  }

  currentRoot = wipRoot;
  flushLayoutEffects();
  schedulePassiveEffectsFlush();
  wipRoot = null;
}

function commitWork(fiber?: I_FIBER | null) {
  if (!fiber) {
    return;
  }

  let parentFiber: I_FIBER | null | undefined = fiber.parent;

  while (parentFiber && !parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }

  const domParent = parentFiber ? parentFiber.dom : null;

  if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);

    return;
  }

  if (fiber.effectTag === 'PLACEMENT') {
    if (fiber.dom && domParent) {
      (domParent as Node & ParentNode).appendChild(fiber.dom);
    } else if (
      fiber.stateNode &&
      typeof fiber.stateNode.componentDidMount === 'function'
    ) {
      queueMicrotask(() => {
        try {
          fiber.stateNode!.componentDidMount!();
        } catch {
          // ignore
        }
      });
    }
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(
      fiber.dom as any,
      (fiber.alternate && fiber.alternate.props) || ({} as I_PROPS),
      fiber.props || ({} as I_PROPS),
      fiber.type as string
    );
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function cleanupEffectsOnFiber(fiber?: I_FIBER | null) {
  if (!fiber?.hooks) {
    return;
  }

  const { hooks } = fiber;

  for (const _h of hooks) {
    const h = _h as I_HOOK_EFFECT;

    if (
      (h?.tag === 'layout' || h?.tag === 'effect') &&
      typeof h?.cleanup === 'function'
    ) {
      try {
        h.cleanup();
      } catch {
        // ignore
      }

      h.cleanup = undefined;
    }
  }
}

function commitDeletion(
  fiber: I_FIBER | null,
  domParent: Node | null | undefined
) {
  if (!fiber) {
    return;
  }

  cleanupEffectsOnFiber(fiber);

  if (fiber.dom) {
    if (fiber.dom.parentNode) {
      fiber.dom.parentNode.removeChild(fiber.dom);
    }

    return;
  }

  commitDeletion(fiber.child ?? null, domParent);

  if (fiber.sibling) {
    commitDeletion(fiber.sibling, domParent);
  }
}

function render(vnode: I_VNODE, container: I_CONTAINER_WITH_VNODE) {
  nextUnitOfWork = wipRoot = {
    alternate: currentRoot,
    dom: container,
    props: { children: [vnode] },
    type: CONST_TYPE_FRAGMENT,
  } as I_FIBER;
  container.__vnode = vnode;
  deletions = [];
}

function performUnitOfWork(fiber: I_FIBER) {
  if (typeof fiber.type === 'function') {
    updateCompositeComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }

  let next: I_FIBER | null = fiber;

  while (next) {
    if (next.sibling) {
      return next.sibling;
    }

    next = next.parent ?? null;
  }

  return null;
}

let wipFiber: I_FIBER | null = null;

function reconcileChildren(wip: I_FIBER, elements?: I_VNODE[]) {
  let index = 0;
  let oldFiber = wip.alternate && wip.alternate.child;
  let prevSibling: I_FIBER | null = null;

  while (index < (elements ? elements.length : 0) || oldFiber != null) {
    const element = elements && elements[index];
    const sameType = oldFiber && element && element.type === oldFiber.type;
    let newFiber: I_FIBER | null = null;

    if (sameType && oldFiber && element) {
      newFiber = {
        alternate: oldFiber,
        dom: oldFiber.dom,
        effectTag: 'UPDATE',
        parent: wip,
        props: element.props,
        stateNode: oldFiber.stateNode,
        type: oldFiber.type,
      } as I_FIBER;
    }

    if (element && !sameType) {
      newFiber = {
        alternate: null,
        dom: null,
        effectTag: 'PLACEMENT',
        parent: wip,
        props: element.props,
        type: element.type,
      } as I_FIBER;
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wip.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    ++index;
  }
}

let hookIndex = 0;

function updateCompositeComponent(fiber: I_FIBER) {
  const t = fiber.type;

  if (isTypeClassComponent(t)) {
    let instance = fiber.stateNode as
      | I_CLASS_COMPONENT_INSTANCE<any>
      | undefined;

    if (!instance) {
      fiber.stateNode = instance = new t({
        ...(fiber.props || {}),
        children: fiber.props?.children || [],
      });
      instance.__updater = function __updater() {
        if (!currentRoot) {
          return;
        }

        nextUnitOfWork = wipRoot = {
          alternate: currentRoot,
          dom: currentRoot.dom,
          props: currentRoot.props,
          type: CONST_TYPE_FRAGMENT,
        } as I_FIBER;
        deletions = [];
      };

      reconcileChildren(fiber, [
        instance.render(createElement as T_CREATE_ELEMENT),
      ]);

      return;
    }

    const prevProps = instance.props as Readonly<any>;
    const prevState = (instance as any).state as Readonly<any>;
    instance.props = {
      ...(fiber.props || {}),
      children: fiber.props?.children || [],
    };
    reconcileChildren(fiber, [
      instance.render(createElement as T_CREATE_ELEMENT),
    ]);
    const callDidUpdate = () => {
      try {
        instance!.componentDidUpdate?.(prevProps, prevState);
      } catch {
        // ignore
      }
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(callDidUpdate);
    } else {
      Promise.resolve().then(callDidUpdate);
    }

    return;
  }

  hookIndex = 0;
  wipFiber = fiber;
  wipFiber.hooks = [];
  reconcileChildren(fiber, [
    (t as T_FUNCTION_COMPONENT<any>)({
      ...(fiber.props || {}),
      children: fiber.props?.children || [],
    }),
  ]);
}

function updateHostComponent(fiber: I_FIBER) {
  if (!fiber.dom) {
    fiber.dom = createDomFromFiber(fiber);
  }

  reconcileChildren(
    fiber,
    fiber.props && Array.isArray(fiber.props.children)
      ? (fiber.props.children as I_VNODE[])
      : []
  );
}

type T_UPDATER_STATE<S> = (_action: S | ((_p: S) => S)) => void;

function useState<S>(initial: S): [S, T_UPDATER_STATE<S>] {
  const oldHook =
    (wipFiber?.alternate?.hooks &&
      (wipFiber.alternate.hooks[hookIndex] as I_HOOK_STATE<S> | undefined)) ||
    undefined;
  const hook: I_HOOK_STATE<S> = {
    queue: [],
    state: oldHook ? oldHook.state : initial,
  };
  const actions = oldHook ? oldHook.queue : [];

  for (const action of actions) {
    hook.state = (
      typeof action === 'function' ? (action as (_p: S) => S) : () => action
    )(hook.state);
  }

  wipFiber!.hooks!.push(hook);
  ++hookIndex;

  return [
    hook.state,
    ((action) => {
      hook.queue.push(action);

      if (!currentRoot) {
        return;
      }

      nextUnitOfWork = wipRoot = {
        alternate: currentRoot,
        dom: currentRoot.dom,
        props: currentRoot.props,
        type: CONST_TYPE_FRAGMENT,
      } as I_FIBER;
      deletions = [];
    }) as T_UPDATER_STATE<S>,
  ];
}

function _areDependenciesChanged(prev?: any[], next?: any[]) {
  const szPrev = prev?.length ?? 0;

  if (szPrev !== next?.length) {
    return true;
  }

  for (let i = 0; i < szPrev; ++i) {
    if (!Object.is(prev![i], next![i])) {
      return true;
    }
  }

  return false;
}

function pushToPendings(
  tag: 'layout' | 'effect',
  create: () => void | (() => void),
  deps?: any[]
) {
  const isLayoutEffect = tag === 'layout';
  const oldHook =
    (wipFiber?.alternate?.hooks &&
      (wipFiber.alternate.hooks[hookIndex] as I_HOOK_EFFECT | undefined)) ||
    undefined;
  const hook: I_HOOK_EFFECT = {
    cleanup: oldHook?.cleanup,
    create,
    deps,
    tag,
  };
  wipFiber!.hooks!.push(hook);
  ++hookIndex;

  if (deps === undefined || _areDependenciesChanged(oldHook?.deps, deps)) {
    (isLayoutEffect ? pendingsLayoutEffects : pendingsPassiveEffects).push({
      fiber: wipFiber!,
      hook,
    });
  }
}

function useEffect(create: () => void | (() => void), deps?: any[]) {
  pushToPendings('effect', create, deps);
}

function useLayoutEffect(create: () => void | (() => void), deps?: any[]) {
  pushToPendings('layout', create, deps);
}

export {
  CONST_TYPE_FRAGMENT,
  CONST_TYPE_TEXT,
  createElement,
  type I_FIBER,
  type I_PROPS,
  type I_VNODE,
  render,
  useEffect,
  useLayoutEffect,
  useState,
};
