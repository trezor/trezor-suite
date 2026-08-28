import { type LocksRootState, lockRouter, selectIsRouterLocked } from '@suite/locks';
import { type ModalRootState } from '@suite/modal';
import { type WithServices, createThunk } from '@suite-common/redux-utils';

import { type AnchorType } from './anchors';
import { type Route } from './route';
import {
    type RouterPathOptional,
    findRoute,
    getAppWithParams,
    getRoute,
    getRouteHash,
    isEqualLocation,
} from './router';
import {
    type RouterRootState,
    anchorChange,
    routerLocationChange,
    selectCanNavigate,
    selectRouter,
    selectRouterApp,
    selectRouterHash,
} from './routerReducer';
import { type RouteParams } from './routes';
import { type SuiteRouterHistoryDep } from './suiteRouterHistory';

/**
 * Handle changes of history.location and history.location.hash
 * Called from ./support/RouterHandler
 */
type OnLocationChangeThunkState = LocksRootState & ModalRootState & RouterRootState;
type OnLocationChangeThunkParams = RouterPathOptional & {
    anchor?: AnchorType;
};

export const onLocationChange = createThunk<
    ReturnType<typeof routerLocationChange> | null | undefined,
    OnLocationChangeThunkParams,
    { state: OnLocationChangeThunkState }
>('@router/onLocationChange', (location, { dispatch, getState }) => {
    const unlocked = selectCanNavigate(getState());
    const router = selectRouter(getState());
    if (!unlocked && router.loaded) return;

    if (isEqualLocation(router, location) && router.app !== 'unknown') {
        return null;
    }

    // TODO: check if the view is not locked by the device request
    const appWithParams = getAppWithParams(location);

    return dispatch(routerLocationChange({ ...location, ...appWithParams }));
});

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
type RouterInitThunkState = LocksRootState & ModalRootState & RouterRootState;
type RouterInitThunkDeps = WithServices<SuiteRouterHistoryDep>;

export const routerInit = createThunk<
    void,
    void,
    { state: RouterInitThunkState; extra: RouterInitThunkDeps }
>('@router/init', (_, { dispatch, getState, extra }) => {
    // check if location was not already changed by initialRedirection
    if (selectRouterApp(getState()) === 'unknown') {
        const location = extra.services.suiteRouterHistory.getLocation();
        dispatch(onLocationChange(location));
    }
});

type GotoPayload = {
    routeName: Route['name'];
    params?: RouteParams;
    preserveParams?: boolean;
    anchor?: AnchorType;
};

export type GotoThunkState = LocksRootState & ModalRootState & RouterRootState;
export type GotoThunkDeps = WithServices<SuiteRouterHistoryDep>;

export const goto = createThunk<void, GotoPayload, { state: GotoThunkState; extra: GotoThunkDeps }>(
    '@router/goto',
    ({ routeName, params, preserveParams, anchor }, { dispatch, getState, extra }) => {
        const hasRouterLock = selectIsRouterLocked(getState());

        if (hasRouterLock) {
            dispatch(lockRouter(false));
        }

        const unlocked = selectCanNavigate(getState());

        if (!unlocked) return;

        const route = getRoute(routeName);
        const newHash = getRouteHash(route, params);
        const pathname = route?.pattern || '/';
        const hash = preserveParams ? selectRouterHash(getState()) : (newHash ?? '');

        if (isEqualLocation(selectRouter(getState()), { pathname, hash, search: '' })) {
            // if location is same, but anchor is set (e.g. click on tor icon when in app settings), let's propagate it to redux state
            if (anchor) {
                // postpone propagation to allow clearing anchor in redux state by click listener
                setTimeout(() => dispatch(anchorChange(anchor)), 0);
            }

            return;
        }

        dispatch(onLocationChange({ pathname, hash, anchor }));
        if (route?.isForegroundApp) {
            dispatch(lockRouter(true));

            // NOTE: this is useful eg. on welcome screen / logged out screen
            // where we want to have suite-start router clearing the URL to ensure
            // that there isn't a state stuck
            if (route.clearUrl) {
                extra.services.suiteRouterHistory.navigate({
                    pathname,
                });
            }

            return;
        }

        extra.services.suiteRouterHistory.navigate({
            pathname,
            hash,
        });
    },
);

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
type CloseModalAppThunkState = GotoThunkState;
type CloseModalAppThunkDeps = GotoThunkDeps;

export const closeModalApp = createThunk<
    void,
    boolean | undefined,
    { state: CloseModalAppThunkState; extra: CloseModalAppThunkDeps }
>('@router/closeModalApp', (preserveParams = true, { dispatch, extra }) => {
    dispatch(lockRouter(false));

    const location = extra.services.suiteRouterHistory.getLocation();
    const route = findRoute(location.pathname);

    if (route?.isForegroundApp) {
        dispatch(goto({ routeName: 'suite-index' }));

        return;
    }

    if (!preserveParams && location.hash.length > 0) {
        extra.services.suiteRouterHistory.navigate({
            pathname: location.pathname,
        });
    } else {
        dispatch(onLocationChange(location));
    }
});

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to requested modal app or welcome screen if `suite.flags.initialRun` is set to true
 */
type InitialRedirectionThunkParams = {
    isInitialRun?: boolean;
};
type InitialRedirectionThunkState = GotoThunkState;
type InitialRedirectionThunkDeps = GotoThunkDeps;

export const initialRedirection = createThunk<
    void,
    InitialRedirectionThunkParams,
    { state: InitialRedirectionThunkState; extra: InitialRedirectionThunkDeps }
>('@suite/initial-redirection', ({ isInitialRun = true }, { dispatch, extra }) => {
    const location = extra.services.suiteRouterHistory.getLocation();
    const route = findRoute(location.pathname);

    // only do initial redirection of route is valid
    // otherwise do nothing -> just show 404 page
    if (!route) {
        return;
    }

    if (route.isForegroundApp) {
        dispatch(goto({ routeName: route.name }));
    } else if (isInitialRun) {
        dispatch(goto({ routeName: 'suite-start' }));
    }
});
