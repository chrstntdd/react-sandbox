import React from 'react';
import { pick, resolve, match, createRoute } from '@/Router/helpers';
import { globalHistory, navigate, createHistory, createMemorySource } from '@/Router/history';
import { isRedirect } from '@/Router/Redirect';

import Link from '@/Router/Link';

const createNamedContext = (name, defaultValue) => {
  const Ctx = React.createContext(defaultValue);
  Ctx.Consumer.displayName = `${name}.Consumer`;
  Ctx.Provider.displayName = `${name}.Provider`;

  return Ctx;
};

////////////////////////////////////////////////////////////////////////////////
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
        if (!this.unmounted) {
          this.setState(() => ({ context: this.getContext() }));
        }
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

////////////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////
// Sets baseuri and basepath for nested routers and links
const BaseContext = createNamedContext('Base', { baseuri: '/', basepath: '/' });

////////////////////////////////////////////////////////////////////////////////
/**
 * @description Main Router component that connects the matched Component to
 *              the contexts.
 * @param props
 */
const Router = props => (
  <BaseContext.Consumer>
    {baseContext => (
      <Location>
        {locationContext => <RouterImpl {...baseContext} {...locationContext} {...props} />}
      </Location>
    )}
  </BaseContext.Consumer>
);

interface PRouterImpl {
  basepath: any;
  baseuri: any;
  component: any;
  location: any;
  navigate: any;
  /* optional */
  primary: boolean;
}

interface SRouterImpl {}

class RouterImpl extends React.PureComponent<PRouterImpl, SRouterImpl> {
  static defaultProps = {
    primary: true
  };

  render() {
    let {
      basepath,
      baseuri,
      children,
      component = 'div',
      location,
      navigate,
      primary,
      ...domProps
    } = this.props;
    const routes = React.Children.map(children, createRoute(basepath));

    const match = pick(routes, location.pathname, location.hash);

    if (match) {
      let {
        params,
        uri,
        route,
        route: { value: element }
      } = match;

      // remove the /* from the end for child routes relative paths
      basepath = route.default ? basepath : route.path.replace(/\*$/, '');

      const props = {
        ...params,
        uri,
        location,
        navigate: (to, options) => navigate(resolve(to, uri), options)
      };

      const clone = React.cloneElement(
        element,
        props,
        element.props.children ? (
          <Router primary={primary}>{element.props.children}</Router>
        ) : (
          undefined
        )
      );

      // using 'div' for < 16.3 support
      const FocusWrapper = primary ? FocusHandler : component;
      // don't pass any props to 'div'
      const wrapperProps = primary ? { uri, location, component, ...domProps } : domProps;

      return (
        <BaseContext.Provider value={{ baseuri: uri, basepath }}>
          <FocusWrapper {...wrapperProps}>{clone}</FocusWrapper>
        </BaseContext.Provider>
      );
    } else {
      return null;
    }
  }
}

const FocusContext = createNamedContext('Focus');

const FocusHandler = ({ uri, location, component, ...domProps }) => (
  <FocusContext.Consumer>
    {requestFocus => (
      <FocusHandlerImpl
        {...domProps}
        component={component}
        requestFocus={requestFocus}
        uri={uri}
        location={location}
      />
    )}
  </FocusContext.Consumer>
);

// don't focus on initial render
let initialRender = true;
let focusHandlerCount = 0;

interface PFocusHandlerImpl {
  component: any;
  requestFocus: (any) => void;
  uri: any;
  location: any;
  role?: string;
  style?: object;
}
interface SFocusHandlerImpl {
  shouldFocus?: boolean;
}

class FocusHandlerImpl extends React.Component<PFocusHandlerImpl, SFocusHandlerImpl> {
  state = {};

  node = null;

  static getDerivedStateFromProps(nextProps, prevState) {
    const initial = !prevState.uri;

    if (initial) {
      return {
        shouldFocus: true,
        ...nextProps
      };
    } else {
      const uriHasChanged = nextProps.uri !== prevState.uri;
      const navigatedUpToMe =
        prevState.location.pathname !== nextProps.location.pathname &&
        nextProps.location.pathname === nextProps.uri;

      return {
        shouldFocus: uriHasChanged || navigatedUpToMe,
        ...nextProps
      };
    }
  }

  componentDidMount() {
    focusHandlerCount++;
    this.focus();
  }

  componentWillUnmount() {
    focusHandlerCount--;
    if (focusHandlerCount === 0) {
      initialRender = true;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.location !== this.props.location && this.state.shouldFocus) {
      this.focus();
    }
  }

  focus() {
    if (process.env.NODE_ENV === 'test') {
      // getting cannot read property focus of null in the tests
      // and that bit of global `initialRender` state causes problems
      // should probably figure it out!
      return;
    }

    let { requestFocus } = this.props;

    if (requestFocus) {
      requestFocus(this.node);
    } else {
      if (initialRender) {
        initialRender = false;
      } else {
        this.node.focus();
      }
    }
  }

  requestFocus = node => {
    if (!this.state.shouldFocus) {
      node.focus();
    }
  };

  render() {
    const {
      children,
      style,
      requestFocus,
      role = 'group',
      component: Comp = 'div',
      uri,
      location,
      ...domProps
    } = this.props;
    return (
      <Comp
        style={{ outline: 'none', ...style }}
        tabIndex="-1"
        role={role}
        ref={n => (this.node = n)}
        {...domProps}
      >
        <FocusContext.Provider value={this.requestFocus}>
          {this.props.children}
        </FocusContext.Provider>
      </Comp>
    );
  }
}

const Match = ({ path, children }) => (
  <BaseContext.Consumer>
    {({ baseuri }) => (
      <Location>
        {({ navigate, location }) => {
          const resolvedPath = resolve(path, baseuri);
          const result = match(resolvedPath, location.pathname);

          return children({
            navigate,
            location,
            match: result
              ? {
                  ...result.params,
                  uri: result.uri,
                  path
                }
              : null
          });
        }}
      </Location>
    )}
  </BaseContext.Consumer>
);

////////////////////////////////////////////////////////////////////////
export {
  Location,
  LocationProvider,
  Match,
  Router,
  ServerLocation,
  createHistory,
  createMemorySource,
  navigate,
  BaseContext,
  /* Components */
  Link
};
