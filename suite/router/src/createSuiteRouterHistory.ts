import { ensureRouterPath, getPrefixedURL, stripPrefixedURL } from './router';
import { type SuiteRouterHistory, type SuiteRouterHistoryDeps } from './suiteRouterHistory';

export const createSuiteRouterHistory = (deps: SuiteRouterHistoryDeps): SuiteRouterHistory => ({
    getLocation: () => {
        const { location } = deps.history;

        return ensureRouterPath({ ...location, pathname: stripPrefixedURL(location.pathname) });
    },
    navigate: (to, state) =>
        deps.history.push(
            { ...to, pathname: to.pathname ? getPrefixedURL(to.pathname) : undefined },
            state,
        ),
    listen: listener =>
        deps.history.listen(({ location, action }) =>
            listener({ location: ensureRouterPath(location), action }),
        ),
});
