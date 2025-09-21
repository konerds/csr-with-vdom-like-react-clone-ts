import { CONST_TYPE_FRAGMENT } from './constants';
import { createElement, type I_VNODE } from './vdom';

const Fragment = CONST_TYPE_FRAGMENT;

function toChildArray(c: any): any[] {
  return c === null || c === undefined || c === false || c === true
    ? []
    : Array.isArray(c)
      ? c
      : [c];
}

function jsx(type: any, props: any, key?: string) {
  const { children, ...rest } = props ?? {};

  if (key != null) {
    (rest as any).key = key;
  }

  return createElement(
    type,
    rest,
    ...toChildArray(
      children === null ||
        children === undefined ||
        children === false ||
        children === true
        ? []
        : Array.isArray(children)
          ? children
          : [children]
    )
  ) as I_VNODE;
}

const jsxs = jsx;

function jsxDEV(type: any, props: any, key?: string) {
  return jsx(type, props, key) as I_VNODE;
}

export { Fragment, jsx, jsxDEV, jsxs };
