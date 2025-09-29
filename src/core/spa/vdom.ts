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
  key?: string | number | null;
}

interface I_PROPS extends T_ANY_PROPS {
  children?: I_VNODE[];
  nodeValue?: string;
  ref?:
    | ((_el: HTMLElement | Text | null) => void)
    | { current?: HTMLElement | Text | null };
}

type T_HOST_TYPE = string;

type T_SPECIAL_TYPE = typeof CONST_TYPE_TEXT | typeof CONST_TYPE_FRAGMENT;

type T_FUNCTION_COMPONENT<P extends I_PROPS = I_PROPS> = (_props: P) => I_VNODE;

type T_CREATE_ELEMENT = <P extends I_PROPS = I_PROPS>(
  _type: T_VNODE_TYPE,
  _props?: P | null,
  ..._children: Array<I_VNODE | string | number | boolean | null | undefined>
) => I_VNODE;

interface I_CLASS_COMPONENT_INSTANCE<P extends I_PROPS = I_PROPS> {
  props: P;
  render(_createElement: T_CREATE_ELEMENT): I_VNODE;
  componentDidMount?(): void;
  componentDidUpdate?(_prevProps: Readonly<P>, _prevState: Readonly<any>): void;
  __updater?: () => void;
}

interface I_CLASS_COMPONENT_CONSTRUCTOR<P extends I_PROPS = I_PROPS> {
  new (_props: P): I_CLASS_COMPONENT_INSTANCE<P>;
  prototype: {
    render: (_createElement: T_CREATE_ELEMENT) => I_VNODE;
  };
}

type T_VNODE_TYPE =
  | T_HOST_TYPE
  | T_SPECIAL_TYPE
  | T_FUNCTION_COMPONENT<any>
  | I_CLASS_COMPONENT_CONSTRUCTOR<any>;

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

interface I_HOOK_REF<T = any> {
  current: T | undefined;
}

interface I_HOOK_MEMO<T = any> {
  value: T;
  deps?: any[] | undefined;
}

type T_HOOK = I_HOOK_STATE | I_HOOK_EFFECT | I_HOOK_REF | I_HOOK_MEMO;

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
  key?: string | number | null;
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

type T_CANCEL_IDLE_CALLBACK = (_id: number) => void;

const polyfillRequestIdleCallback: T_REQUEST_IDLE_CALLBACK =
  typeof requestIdleCallback === 'function'
    ? (cb) => requestIdleCallback(cb)
    : (cb) =>
        setTimeout(
          () => cb({ didTimeout: true, timeRemaining: () => 0 }),
          1
        ) as unknown as number;

const polyfillCancelIdleCallback: T_CANCEL_IDLE_CALLBACK =
  typeof cancelIdleCallback === 'function'
    ? (id) => cancelIdleCallback(id)
    : (id) => clearTimeout(id as any);

let _scheduledIdleCbId: number | null = null;

function _cancelScheduledWorkLoop() {
  if (_scheduledIdleCbId != null) {
    polyfillCancelIdleCallback(_scheduledIdleCbId);
    _scheduledIdleCbId = null;
  }
}

function _ensureWorkLoopScheduled() {
  if (_scheduledIdleCbId != null || (!nextUnitOfWork && !wipRoot)) {
    return;
  }

  _scheduledIdleCbId = polyfillRequestIdleCallback((deadline) => {
    _scheduledIdleCbId = null;
    workLoop(deadline);
  });
}

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
    name = 'class';
  }

  if (name === 'htmlFor') {
    name = 'for';
  }

  if (name === 'style') {
    if (value == null || value === false) {
      (dom as HTMLElement).removeAttribute('style');

      return;
    }

    if (typeof value === 'string') {
      (dom as HTMLElement).style.cssText = value;

      return;
    }

    return;
  }

  if (name === 'class') {
    if (value == null || value === false) {
      (dom as HTMLElement).removeAttribute('class');

      return;
    }

    (dom as HTMLElement).setAttribute('class', String(value));

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

  if (name === 'ref') {
    if (typeof value === 'function') {
      value(dom || null);

      return;
    }

    if (value && typeof value === 'object') {
      (value as any).current = dom || null;

      return;
    }

    return;
  }

  if (value === false || value === null || value === undefined) {
    dom.removeAttribute(name);

    return;
  }

  dom.setAttribute(name, value === true ? '' : String(value));
}

function updateStyleShallowly(
  el: HTMLElement,
  prev?: Record<string, any>,
  next?: Record<string, any>
) {
  const p = prev || {};
  const n = next || {};

  for (const k in p) {
    if (k in n) {
      continue;
    }

    (el.style as any)[k] = '';
  }

  for (const k in n) {
    if (Object.is(p[k], n[k])) {
      continue;
    }

    (el.style as any)[k] = n[k];
  }
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

  if (propsPrev?.style !== undefined || propsNext?.style !== undefined) {
    const el = dom as unknown as HTMLElement;
    const valuePrev = propsPrev?.style as any;
    const valueNext = propsNext?.style as any;

    if (typeof valueNext === 'string') {
      el.style.cssText = valueNext || '';
    } else if (valueNext && typeof valueNext === 'object') {
      updateStyleShallowly(
        el,
        typeof valuePrev === 'object' ? valuePrev : undefined,
        valueNext
      );
    } else {
      el.removeAttribute?.('style');
    }
  }

  const listBypass = new Set(['children', 'nodeValue', 'key', 'style']);
  const keys = new Set<string>([
    ...Object.keys(propsPrev || {}),
    ...Object.keys(propsNext || {}),
  ]);

  for (const k of keys) {
    if (listBypass.has(k)) {
      continue;
    }

    const valuePrev = propsPrev ? (propsPrev as any)[k] : undefined;
    const valueNext = propsNext ? (propsNext as any)[k] : undefined;

    if (Object.is(valuePrev, valueNext)) {
      continue;
    }

    setProp(dom as I_HTML_WITH_LISTENERS, k, valueNext);
  }
}

function _normalizeChildren(input: any[]): I_VNODE[] {
  const flat: any[] = [];

  const flatten = (arr: any[]) => {
    for (const c of arr) {
      if (Array.isArray(c)) {
        flatten(c);

        continue;
      }

      flat.push(c);
    }
  };

  flatten(input);

  const out: I_VNODE[] = [];

  for (const c of flat) {
    if (c === null || c === undefined || c === false || c === true) {
      continue;
    }

    out.push(
      typeof c === 'string' || typeof c === 'number'
        ? ({
            props: { nodeValue: String(c) } as I_PROPS,
            type: CONST_TYPE_TEXT,
          } as I_VNODE)
        : (c as I_VNODE)
    );
  }

  return out;
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
  const { key = null, ..._props } = props || {};

  return {
    key,
    props: {
      ...(_props || {}),
      children: _normalizeChildren(children as any[]),
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

  if (nextUnitOfWork || wipRoot) {
    _ensureWorkLoopScheduled();

    return;
  }

  _cancelScheduledWorkLoop();
}

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

  if (runs.length === 0) {
    return;
  }

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

  runs.length = 0;
}

let pendingsPassiveEffects: I_PENDINGS[] = [];
let _passiveFlushScheduled = false;

function schedulePassiveEffectsFlush() {
  const runs = pendingsPassiveEffects;
  pendingsPassiveEffects = [];

  if (runs.length === 0) {
    return;
  }

  if (_passiveFlushScheduled) {
    pendingsLayoutEffects.push(...runs);

    return;
  }

  _passiveFlushScheduled = true;

  setTimeout(() => {
    try {
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

      runs.length = 0;
    } finally {
      _passiveFlushScheduled = false;
    }
  }, 0);
}

let deletions: I_FIBER[] = [];
let currentRoot: I_FIBER | null = null;

function _pruneAlternatePointers(root: I_FIBER | null) {
  const stack: I_FIBER[] = [];

  if (root) {
    stack.push(root);
  }

  while (stack.length) {
    const f = stack.pop()!;

    if (f.child) {
      stack.push(f.child);
    }

    if (f.sibling) {
      stack.push(f.sibling);
    }

    (f as any).alternate = null;
  }
}

function commitRoot() {
  for (const deletion of deletions) {
    commitWork(deletion);
  }

  deletions = [];

  if (wipRoot) {
    commitWork(wipRoot.child);
  }

  _pruneAlternatePointers((currentRoot = wipRoot));
  flushLayoutEffects();
  schedulePassiveEffectsFlush();
  wipRoot = null;

  if (!nextUnitOfWork && !wipRoot) {
    _cancelScheduledWorkLoop();
  }
}

function _getHostSibling(fiber: I_FIBER): Node | null {
  let node: I_FIBER | null = fiber;

  findSibling: while (node) {
    while (node && !node.sibling) {
      node = node.parent ?? null;

      if (!node || node.dom) {
        return null;
      }
    }

    if (!node) {
      return null;
    }

    node = node.sibling!;

    while (node && !node.dom) {
      if (node.effectTag === 'PLACEMENT') {
        continue findSibling;
      }

      if (!node.child) {
        continue findSibling;
      }

      node = node.child;
    }

    if (node && node.dom && node.effectTag !== 'PLACEMENT') {
      return node.dom as Node;
    }
  }

  return null;
}

function _insertBeforeOrAppend(parent: Node, node: Node, before: Node | null) {
  if (before) {
    (parent as ParentNode).insertBefore(node, before);

    return;
  }

  (parent as ParentNode).appendChild(node);
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
    if (domParent) {
      const anchor = _getHostSibling(fiber);

      if (fiber.dom) {
        _insertBeforeOrAppend(domParent as Node, fiber.dom as Node, anchor);
      }

      if (
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

  const ref = fiber.props?.ref as any;

  if (typeof ref === 'function') {
    try {
      ref(null);
    } catch {
      // ignore
    }
  }
}

function _removeAllDomListenersAndRef(
  dom: I_HTML_WITH_LISTENERS | Text | null | undefined,
  props?: I_PROPS
) {
  if (dom && (dom as Node).nodeType !== Node.TEXT_NODE) {
    const el = dom as I_HTML_WITH_LISTENERS;
    const map = el.__listeners;

    if (map) {
      for (const type in map) {
        try {
          el.removeEventListener(type, map[type]);
        } catch {
          // ignore
        }
      }

      el.__listeners = undefined;
    }
  }

  const ref = props?.ref as any;

  if (ref && typeof ref === 'object') {
    ref.current = null;

    return;
  }

  if (typeof ref === 'function') {
    try {
      ref(null);
    } catch {
      // ignore
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

  const removeDescendants = (node: I_FIBER | null | undefined) => {
    if (!node) {
      return;
    }

    removeDescendants(node.child);
    removeDescendants(node.sibling);
    cleanupEffectsOnFiber(node);

    if (node.dom) {
      _removeAllDomListenersAndRef(node.dom as any, node.props);
      const parent = (node.dom as any).parentNode;

      if (parent) {
        parent.removeChild(node.dom as any);

        return;
      }

      if (domParent && (domParent as Node).contains(node.dom as any)) {
        try {
          (domParent as Node).removeChild(node.dom as any);
        } catch {
          // ignore
        }
      }
    }
  };

  if (fiber.dom) {
    _removeAllDomListenersAndRef(fiber.dom as any, fiber.props);
    const parent = (fiber.dom as any).parentNode;

    if (parent) {
      parent.removeChild(fiber.dom as any);
    }
  }

  removeDescendants(fiber.child);
  cleanupEffectsOnFiber(fiber);
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

  _ensureWorkLoopScheduled();
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

function _unwrapFragments(elements?: I_VNODE[] | null): I_VNODE[] {
  const out: I_VNODE[] = [];
  const list = Array.isArray(elements) ? elements! : [];

  for (const el of list) {
    if (!el) {
      continue;
    }

    if (el.type === CONST_TYPE_FRAGMENT) {
      out.push(..._unwrapFragments((el.props?.children as I_VNODE[]) || []));

      continue;
    }

    out.push(el);
  }

  return out;
}

let wipFiber: I_FIBER | null = null;

function reconcileChildren(wip: I_FIBER, elements?: I_VNODE[]) {
  let index = 0;
  let oldFiber = wip.alternate && wip.alternate.child;
  let prevSibling: I_FIBER | null = null;
  const nextChildren = _unwrapFragments(elements || []);
  const szNextChildren = nextChildren.length;

  while (index < szNextChildren || oldFiber != null) {
    const element = nextChildren[index];
    const sameTypeAndKey =
      oldFiber &&
      element &&
      element.type === oldFiber.type &&
      (oldFiber.key ?? null) === (element.key ?? null);

    let newFiber: I_FIBER | null = null;

    if (sameTypeAndKey && oldFiber && element) {
      newFiber = {
        alternate: oldFiber,
        dom: oldFiber.dom ?? null,
        effectTag: 'UPDATE',
        hooks: oldFiber.hooks ? [] : undefined,
        key: element.key ?? null,
        parent: wip,
        props: element.props,
        stateNode: oldFiber.stateNode,
        type: oldFiber.type,
      } as I_FIBER;
    } else if (element) {
      newFiber = {
        alternate: null,
        dom: null,
        effectTag: 'PLACEMENT',
        key: element.key ?? null,
        parent: wip,
        props: element.props,
        type: element.type,
      } as I_FIBER;
    }

    if (oldFiber && !sameTypeAndKey) {
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

        _ensureWorkLoopScheduled();
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
  reconcileChildren(
    fiber,
    _unwrapFragments([
      (t as T_FUNCTION_COMPONENT<any>)({
        ...(fiber.props || {}),
        children: fiber.props?.children || [],
      }),
    ])
  );
}

function updateHostComponent(fiber: I_FIBER) {
  if (!fiber.dom) {
    fiber.dom = createDomFromFiber(fiber);
  }

  reconcileChildren(
    fiber,
    _unwrapFragments(
      fiber.props && Array.isArray(fiber.props.children)
        ? (fiber.props.children as I_VNODE[])
        : []
    )
  );
}

type T_UPDATER_STATE<S> = (_action: S | ((_p: S) => S)) => void;

function useState<S>(initial: S): [S, T_UPDATER_STATE<S>] {
  const oldHook =
    (wipFiber?.alternate?.hooks &&
      (wipFiber.alternate.hooks[hookIndex] as I_HOOK_STATE<S> | undefined)) ||
    undefined;
  const queueShared = oldHook?.queue ?? [];
  let state = oldHook ? oldHook.state : initial;
  const szQueueShared = queueShared.length;

  if (szQueueShared) {
    for (let i = 0; i < szQueueShared; ++i) {
      const action = queueShared[i] as S | ((_p: S) => S);
      state =
        typeof action === 'function'
          ? (action as (_p: S) => S)(state)
          : (action as S);
    }

    queueShared.length = 0;
  }

  const hook: I_HOOK_STATE<S> = {
    queue: queueShared,
    state,
  };
  wipFiber!.hooks!.push(hook);
  ++hookIndex;

  return [
    state,
    ((action) => {
      queueShared.push(action);

      const rootBase = currentRoot ?? wipRoot;

      if (!rootBase) {
        return;
      }

      nextUnitOfWork = wipRoot = {
        alternate: rootBase,
        dom: rootBase.dom,
        props: rootBase.props,
        type: CONST_TYPE_FRAGMENT,
      } as I_FIBER;
      deletions = [];
      _ensureWorkLoopScheduled();
    }) as T_UPDATER_STATE<S>,
  ];
}

function _areDependenciesChanged(prev?: any[], next?: any[]) {
  if (!prev || !next) {
    return true;
  }

  const sz = prev.length ?? 0;

  if (sz !== next.length) {
    return true;
  }

  for (let i = 0; i < sz; ++i) {
    if (!Object.is(prev[i], next![i])) {
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

function useRef<T>(initial?: T) {
  const hook = ((wipFiber?.alternate?.hooks &&
    (wipFiber.alternate.hooks[hookIndex] as I_HOOK_REF<T> | undefined)) ||
    undefined) ?? { current: initial as T | undefined };
  wipFiber!.hooks!.push(hook as T_HOOK);

  ++hookIndex;

  return hook;
}

function useMemo<T>(factory: () => T, deps?: any[]): T {
  const oldHook =
    (wipFiber?.alternate?.hooks &&
      (wipFiber.alternate.hooks[hookIndex] as I_HOOK_MEMO<T> | undefined)) ||
    undefined;
  const hook: I_HOOK_MEMO<T> = {
    deps: oldHook?.deps,
    value: oldHook?.value as T,
  };

  if (!deps) {
    hook.deps = undefined;
    hook.value = factory();
  } else if (_areDependenciesChanged(oldHook?.deps, deps)) {
    hook.value = factory();
    hook.deps = deps;
  }

  wipFiber!.hooks!.push(hook as T_HOOK);
  ++hookIndex;

  return hook.value;
}

function useCallback<T extends (..._args: any[]) => any>(cb: T, deps?: any[]) {
  return useMemo(() => cb, deps);
}

export {
  CONST_TYPE_FRAGMENT,
  CONST_TYPE_TEXT,
  createElement,
  type I_FIBER,
  type I_PROPS,
  type I_VNODE,
  render,
  type T_CREATE_ELEMENT,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
};
