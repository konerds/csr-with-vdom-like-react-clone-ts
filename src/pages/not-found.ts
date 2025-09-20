import { Component, createElement as el } from '@core';

class Page404 extends Component {
  render() {
    const { route } = this.props;

    return el('main', { className: `${route}-page` }, '404 Not Found');
  }
}

export { Page404 };
