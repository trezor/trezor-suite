import { ensureRouterPath, getPrefixedURL, stripPrefixedURL } from './router';
import { type SuiteRouterHistory, type SuiteRouterHistoryDeps } from './suiteRouterHistory';

// Marks entries pushed by Suite, so a back from them lands on a Suite page rather than outside the app.
const SUITE_ENTRY_STATE = { isSuiteEntry: true };

const isSuiteEntry = (state: unknown) =>
    typeof state === 'object' &&
    state !== null &&
    'isSuiteEntry' in state &&
    state.isSuiteEntry === true;

export const createSuiteRouterHistory = (deps: SuiteRouterHistoryDeps): SuiteRouterHistory => ({
    getLocation: () => {
        const { location } = deps.history;

        return ensureRouterPath({ ...location, pathname: stripPrefixedURL(location.pathname) });
    },
    navigate: (to, state) =>
        deps.history.push(
            { ...to, pathname: to.pathname ? getPrefixedURL(to.pathname) : undefined },
            { ...state, ...SUITE_ENTRY_STATE },
        ),
    back: () => {
        if (!isSuiteEntry(deps.history.location.state)) {
            return false;
        }

        deps.history.back();

        return true;
    },
    listen: listener =>
        deps.history.listen(({ location, action }) =>
            listener({ location: ensureRouterPath(location), action }),
        ),
});
