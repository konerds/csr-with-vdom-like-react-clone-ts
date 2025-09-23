import type { I_VNODE } from '@core';

declare global {
  namespace JSX {
    type Element = I_VNODE;

    interface IntrinsicElements {
      [tag: string]: any;
    }

    interface IntrinsicAttributes {
      [attr: string]: any;
    }
  }
}

export {};
