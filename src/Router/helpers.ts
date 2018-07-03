import { Redirect } from './Redirect';

////////////////////////////////////////////////////////////////////////////////

const startsWith = (string: string, search: string): boolean =>
  string.substr(0, search.length) === search;

const shouldNavigate = event =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

const stripSlashes = (str: string): string => str.replace(/(^\/+|\/+$)/g, '');

const createRoute = basepath => (element): Route => {
  if (element.props.default) {
    return { value: element, default: true };
  }

  let elementPath = element.type === Redirect ? element.props.from : element.props.path;

  let path =
    elementPath === '/' ? basepath : `${stripSlashes(basepath)}/${stripSlashes(elementPath)}`;

  return {
    value: element,
    default: element.props.default,
    path: element.props.children ? `${stripSlashes(path)}/*` : path
  };
};

interface Route {
  default?: boolean;
  path?: string;
  value: React.ReactNode;
}

interface ReturnRoute {
  params: any;
  route: {
    default?: any;
    path: string;
    value: React.ReactNode;
  };
  uri: string;
}

/**
 *
 * @description Ranks and picks the best route to match. Each segment gets the highest
 * amount of points, then the type of segment gets an additional amount of
 * points where
 *
 * `static > dynamic > wildcard > root`
 */
const pick = (routes: Route[], uri: string): ReturnRoute | null => {
  let match;
  let default_;

  const [uriPathname] = uri.split('?');
  const uriSegments = segmentize(uriPathname);
  const isRootUri = uriSegments[0] === '';
  const ranked = rankRoutes(routes);

  for (let i = 0, l = ranked.length; i < l; i++) {
    const route = ranked[i].route;
    let missed = false;

    if (route.default) {
      default_ = {
        route,
        params: {},
        uri
      };
      continue;
    }

    const routeSegments = segmentize(route.path);
    const params = {};
    const max = Math.max(uriSegments.length, routeSegments.length);
    let index = 0;

    for (; index < max; index++) {
      const routeSegment = routeSegments[index];
      const uriSegment = uriSegments[index];

      if (isWildcard(routeSegment)) {
        // Hit a wildcard, just grab the rest, and return a match
        // uri:   /files/documents/work
        // route: /files/*
        params['*'] = uriSegments
          .slice(index)
          .map(decodeURIComponent)
          .join('/');
        break;
      }

      if (uriSegment === undefined) {
        // URI is shorter than the route, no match
        // uri:   /users
        // route: /users/:userId
        missed = true;
        break;
      }

      const dynamicMatch = paramRe.exec(routeSegment);

      if (dynamicMatch && !isRootUri) {
        let matchIsNotReserved = reservedNames.indexOf(dynamicMatch[1]) === -1;

        console.warn(
          matchIsNotReserved,
          `<Router> dynamic segment "${
            dynamicMatch[1]
          }" is a reserved name. Please use a different name in path "${route.path}".`
        );

        const value = decodeURIComponent(uriSegment);
        params[dynamicMatch[1]] = value;
      } else if (routeSegment !== uriSegment) {
        // Current segments don't match, not dynamic, not a wildcard, so no match
        // uri:   /users/123/settings
        // route: /users/:id/profile
        missed = true;
        break;
      }
    }

    if (!missed) {
      match = {
        route,
        params,
        uri: '/' + uriSegments.slice(0, index).join('/')
      };
      break;
    }
  }

  return match || default_ || null;
};

////////////////////////////////////////////////////////////////////////////////
// match(path, uri) - Matches just one path to a uri, also lol
const match = (path, uri) => pick([{ path }], uri);

////////////////////////////////////////////////////////////////////////////////
// resolve(to, basepath)
//
// Resolves URIs as though every path is a directory, no files.  Relative URIs
// in the browser can feel awkward because not only can you be "in a directory"
// you can be "at a file", too. For example
//
//     browserSpecResolve('foo', '/bar/') => /bar/foo
//     browserSpecResolve('foo', '/bar') => /foo
//
// But on the command line of a file system, it's not as complicated, you can't
// `cd` from a file, only directories.  This way, links have to know less about
// their current path. To go deeper you can do this:
//
//     <Link to="deeper"/>
//     // instead of
//     <Link to=`{${props.uri}/deeper}`/>
//
// Just like `cd`, if you want to go deeper from the command line, you do this:
//
//     cd deeper
//     # not
//     cd $(pwd)/deeper
//
// By treating every path as a directory, linking to relative paths should
// require less contextual information and (fingers crossed) be more intuitive.
const resolve = (to, base) => {
  // /foo/bar, /baz/qux => /foo/bar
  if (startsWith(to, '/')) {
    return to;
  }

  let [toPathname, toQuery] = to.split('?');
  let [basePathname] = base.split('?');

  let toSegments = segmentize(toPathname);
  let baseSegments = segmentize(basePathname);

  // ?a=b, /users?b=c => /users?a=b
  if (toSegments[0] === '') {
    return addQuery(basePathname, toQuery);
  }

  // profile, /users/789 => /users/789/profile
  if (!startsWith(toSegments[0], '.')) {
    let pathname = baseSegments.concat(toSegments).join('/');
    return addQuery((basePathname === '/' ? '' : '/') + pathname, toQuery);
  }

  // ./         /users/123  =>  /users/123
  // ../        /users/123  =>  /users
  // ../..      /users/123  =>  /
  // ../../one  /a/b/c/d    =>  /a/b/one
  // .././one   /a/b/c/d    =>  /a/b/c/one
  let allSegments = baseSegments.concat(toSegments);
  let segments = [];
  for (let i = 0, l = allSegments.length; i < l; i++) {
    let segment = allSegments[i];
    if (segment === '..') segments.pop();
    else if (segment !== '.') segments.push(segment);
  }

  return addQuery('/' + segments.join('/'), toQuery);
};

const insertParams = (path, params) => {
  const segments = segmentize(path);

  return (
    '/' +
    segments
      .map(segment => {
        const match = paramRe.exec(segment);

        return match ? params[match[1]] : segment;
      })
      .join('/')
  );
};

const validateRedirect = (from, to) => {
  const filter = segment => isDynamic(segment);
  const fromString = segmentize(from)
    .filter(filter)
    .sort()
    .join('/');
  const toString = segmentize(to)
    .filter(filter)
    .sort()
    .join('/');

  return fromString === toString;
};

////////////////////////////////////////////////////////////////////////////////
// Junk
const paramRe = /^:(.+)/;

const SEGMENT_POINTS = 4;
const STATIC_POINTS = 3;
const DYNAMIC_POINTS = 2;
const WILDCARD_PENALTY = 1;
const ROOT_POINTS = 1;

const isRootSegment = segment => segment === '';
const isDynamic = segment => paramRe.test(segment);
const isWildcard = segment => segment === '*';

const rankRoute = (route, index) => {
  const score = route.default
    ? 0
    : segmentize(route.path).reduce((score, segment) => {
        score += SEGMENT_POINTS;

        if (isRootSegment(segment)) score += ROOT_POINTS;
        else if (isDynamic(segment)) score += DYNAMIC_POINTS;
        else if (isWildcard(segment)) score -= SEGMENT_POINTS + WILDCARD_PENALTY;
        else score += STATIC_POINTS;

        return score;
      }, 0);
  return { route, score, index };
};

const rankRoutes = routes =>
  routes
    .map(rankRoute)
    .sort((a, b) => (a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index));

const segmentize = uri =>
  uri
    // strip starting/ending slashes
    .replace(/(^\/+|\/+$)/g, '')
    .split('/');

const addQuery = (pathname, query) => pathname + (query ? `?${query}` : '');

const reservedNames = ['uri', 'path'];

////////////////////////////////////////////////////////////////////////////////
export {
  createRoute,
  startsWith,
  pick,
  match,
  resolve,
  insertParams,
  validateRedirect,
  shouldNavigate,
  stripSlashes
};
