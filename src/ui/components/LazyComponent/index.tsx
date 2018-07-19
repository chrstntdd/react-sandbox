import React from 'react';

/**
 * @description To return a new React component, ready to be instantiated.
 * Note the closure here protecting Component, and providing a unique
 * instance of Component to the static implementation of `load`.
 */
const generateLazyComponent = loader => {
  let Component = null;

  return class AsyncRouteComponent extends React.Component {
    static displayName = 'AsyncComponent';

    state = { Component };

    componentDidMount() {
      AsyncRouteComponent.load().then(this.updateState);
    }

    /**
     * @description Only update the state if there is not a reference
     * to the component. This is to prevent unnecessary renders.
     */
    updateState = () => {
      if (this.state.Component !== Component) {
        this.setState({ Component });
      }
    };

    /**
     * @description Static so that `load` can be called against an
     * uninstantiated version of this component. This function should
     * only be called one time outside of the normal render path.
     */
    static load() {
      return loader().then(ResolvedComponent => {
        Component = ResolvedComponent.default || ResolvedComponent;
      });
    }

    render() {
      const { Component: ComponentFromState } = this.state;

      if (ComponentFromState) return <ComponentFromState {...this.props} />;

      return null;
    }
  };
};

export default generateLazyComponent;
