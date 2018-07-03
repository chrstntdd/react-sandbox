import React from 'react';
import ReactDOM from 'react-dom';

import { isRedirect } from '@/Router/Redirect';

import { globalHistory } from '@/Router/history';
import { createNamedContext } from '@/Router/helpers';

// Location Context/Provider
const LocationContext = createNamedContext('Location');

// sets up a listener if there isn't one already so apps don't need to be
// wrapped in some top level provider
const Location = ({ children }) => (
  <LocationContext.Consumer>
    {context => (context ? children(context) : <LocationProvider>{children}</LocationProvider>)}
  </LocationContext.Consumer>
);

interface PLocationProvider {
  history?: any;
  children?: (any) => JSX.Element;
}
interface SLocationProvider {
  context: {
    navigate: any;
    location: any;
  };
  refs: {
    unlisten: any;
  };
}

class LocationProvider extends React.Component<PLocationProvider, SLocationProvider> {
  public static defaultProps: Partial<PLocationProvider> = {
    history: globalHistory
  };

  state = {
    context: this.getContext(),
    refs: { unlisten: null }
  };

  unmounted = null;

  componentDidMount() {
    this.state.refs.unlisten = this.props.history.listen(() => {
      Promise.resolve().then(() => {
        ReactDOM.unstable_deferredUpdates(() => {
          if (!this.unmounted) {
            this.setState(() => ({ context: this.getContext() }));
          }
        });
      });
    });
  }

  componentDidCatch(error, info) {
    if (isRedirect(error)) {
      this.props.history.navigate(error.uri, { replace: true });
    } else {
      throw error;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.context.location !== this.state.context.location) {
      this.props.history._onTransitionComplete();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.state.refs.unlisten();
  }

  getContext() {
    const {
      props: {
        history: { navigate, location }
      }
    } = this;

    return { navigate, location };
  }

  render() {
    const isChildFn = typeof this.props.children === 'function';

    return (
      <LocationContext.Provider value={this.state.context}>
        {isChildFn ? this.props.children(this.state.context) : this.props.children || null}
      </LocationContext.Provider>
    );
  }
}

/**
 *
 * @description When you render a <Redirect/>  a redirect request is thrown,
 * preventing react from rendering the whole tree when we don’t want to do
 * that work anyway.
 *
 * To enable SSR, wrap the top level <App /> component with this component
 * and pass it the url that exists on the request object of whichever node
 * framework is being used.
 */
const ServerLocation = ({ url, children }) => (
  <LocationContext.Provider
    value={{
      location: { pathname: url },
      navigate: () => {
        throw new Error("You can't call navigate on the server.");
      }
    }}
  >
    {children}
  </LocationContext.Provider>
);

export { ServerLocation, Location, LocationProvider };
