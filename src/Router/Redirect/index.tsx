import React from 'react';

import { Location } from '@/Router';
import { insertParams } from '@/Router/helpers';

function RedirectRequest(uri) {
  this.uri = uri;
}

const isRedirect = o => o instanceof RedirectRequest;

const redirectTo = to => {
  throw new RedirectRequest(to);
};

class RedirectImpl extends React.Component {
  // Support React < 16 with this hook
  componentDidMount() {
    let {
      props: { navigate, to, from, replace = true, state, noThrow, ...props }
    } = this;
    Promise.resolve().then(() => {
      navigate(insertParams(to, props), { replace, state });
    });
  }

  render() {
    let {
      props: { navigate, to, from, replace, state, noThrow, ...props }
    } = this;
    if (!noThrow) redirectTo(insertParams(to, props));
    return null;
  }
}

const Redirect = props => (
  <Location>{locationContext => <RedirectImpl {...locationContext} {...props} />}</Location>
);

export { RedirectRequest, isRedirect, redirectTo, RedirectImpl, Redirect };
