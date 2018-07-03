import React, { forwardRef } from 'react';

import { noop } from '@/utils';
import { startsWith, resolve, shouldNavigate } from '@/Router/helpers';
import { BaseContext, Location } from '@/Router';

const Link = forwardRef(({ innerRef, ...props }, ref) => (
  <BaseContext.Consumer>
    {({ basepath, baseuri }) => (
      <Location>
        {({ location, navigate }) => {
          let { to, state, replace, getProps = noop, ...anchorProps } = props;
          let href = resolve(to, baseuri);
          let isCurrent = location.pathname === href;
          let isPartiallyCurrent = startsWith(location.pathname, href);

          return (
            <a
              ref={ref || innerRef}
              aria-current={isCurrent ? 'page' : undefined}
              {...anchorProps}
              {...getProps({ isCurrent, isPartiallyCurrent, href, location })}
              href={href}
              onClick={event => {
                if (anchorProps.onClick) anchorProps.onClick(event);
                if (shouldNavigate(event)) {
                  event.preventDefault();
                  navigate(href, { state, replace });
                }
              }}
            />
          );
        }}
      </Location>
    )}
  </BaseContext.Consumer>
));

export default Link;
