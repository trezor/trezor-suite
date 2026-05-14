import { ensureRouterPath, getPrefixedURL, stripPrefixedURL } from './router';
import { type SuiteRouterHistory, type SuiteRouterHistoryDeps } from './suiteRouterHistory';

export const createSuiteRouterHistory = ({
    history,
}: SuiteRouterHistoryDeps): SuiteRouterHistory => ({
    getLocation: () => {
        const { location } = history;

        return ensureRouterPath({ ...location, pathname: stripPrefixedURL(location.pathname) });
    },
    navigate: (to, state) =>
        history.push(
            { ...to, pathname: to.pathname ? getPrefixedURL(to.pathname) : undefined },
            state,
        ),
    listen: listener =>
        history.listen(({ location, action }) =>
            listener({ location: ensureRouterPath(location), action }),
        ),
});
