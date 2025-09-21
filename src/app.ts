import { Component, CONST_TYPE_FRAGMENT, createElement as el } from '@core';

import { ProviderRouter } from './router/index.js';

class App extends Component {
  render() {
    return el(CONST_TYPE_FRAGMENT, {}, el(ProviderRouter));
  }
}

new App().mount(document.getElementById('app')!);
