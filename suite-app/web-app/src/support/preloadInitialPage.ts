import { type PathString, findRoute } from '@suite/router';
import { resolveRouteComponentName } from '@suite-app/app';

import { webPages } from './webComponents';

/** Fetches the chunk of the page the URL opens while the app boots, not after boot ends. */
export const preloadInitialPage = (location: { pathname: PathString }) => {
    const route = findRoute(location.pathname);
    // An unknown URL shows the error page, not a lazy page.
    if (!route) return;

    const pageName = resolveRouteComponentName(route.name, webPages) ?? 'suite-index';
    // Silent on failure: the page loads the chunk again when it renders and reports the failure there.
    webPages[pageName].preload();
};
