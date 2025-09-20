import {
  Component,
  CONST_MODES_ROUTER,
  CONST_TYPE_FRAGMENT,
  createElement as el,
  T_MODES_ROUTER,
} from '@core';

import { ProviderRouter } from './router/index.js';

let mode: T_MODES_ROUTER = CONST_MODES_ROUTER.HISTORY;
mode = CONST_MODES_ROUTER.HASH;

class App extends Component {
  render() {
    return el(CONST_TYPE_FRAGMENT, {}, el(ProviderRouter, { mode }));
  }
}

new App().mount(document.getElementById('app')!);
