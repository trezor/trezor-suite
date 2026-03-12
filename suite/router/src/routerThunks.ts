import { lockRouter, selectIsRouterLocked, selectIsRouterOrUiLocked } from '@suite/locks';
import { selectHasActiveModal } from '@suite/modal';
import { createThunk } from '@suite-common/redux-utils';
import { Route } from '@suite-common/suite-types';

import { AnchorType } from './anchors';
import { findRoute, getAppWithParams, getRoute, getRouteHash, isEqualLocation } from './router';
import {
    anchorChange,
    routerLocationChange,
    selectRouter,
    selectRouterApp,
    selectRouterHash,
} from './routerReducer';
import { RouteParams } from './routes';
import { SuiteRouterHistoryDep } from './suiteRouterHistory';

const asSuiteRouterHistory = (services: Record<string, unknown>): SuiteRouterHistoryDep =>
    services as SuiteRouterHistoryDep;

export const selectCanNavigate = (state: any) =>
    !selectIsRouterOrUiLocked(state) && !selectHasActiveModal(state);

/**
 * Handle Router.beforePopState action (back)
 * Called from ./support/RouterHandler
 */
export const onBeforePopState = createThunk('@router/onBeforePopState', (_, { getState }) =>
    selectCanNavigate(getState()),
);

/**
 * Handle changes of history.location and history.location.hash
 * Called from ./support/RouterHandler
 */
export const onLocationChange = createThunk(
    '@router/onLocationChange',
    (
        location: { anchor?: AnchorType } & Partial<{
            pathname: string;
            hash: string;
            search: string;
        }>,
        { dispatch, getState },
    ) => {
        const unlocked = selectCanNavigate(getState());
        const router = selectRouter(getState());
        if (!unlocked && router.loaded) return;

        if (isEqualLocation(router, location) && router.app !== 'unknown') {
            return null;
        }

        const appWithParams = getAppWithParams(location);

        return dispatch(routerLocationChange({ ...location, ...appWithParams }));
    },
);

// if anchor param is not set, it works as reset
export const onAnchorChange = createThunk(
    '@router/onAnchorChange',
    (anchor: AnchorType | undefined, { dispatch }) => dispatch(anchorChange(anchor)),
);

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const routerInit = createThunk('@router/init', (_, { dispatch, getState, extra }) => {
    if (selectRouterApp(getState()) === 'unknown') {
        const location = asSuiteRouterHistory(extra.services).suiteRouterHistory.getLocation();
        dispatch(onLocationChange(location));
    }
});

type GotoPayload = {
    routeName: Route['name'];
    params?: RouteParams;
    preserveParams?: boolean;
    anchor?: AnchorType;
};

// links inside of application
export const goto = createThunk(
    '@router/goto',
    ({ routeName, params, preserveParams, anchor }: GotoPayload, { dispatch, getState, extra }) => {
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
            if (anchor) {
                setTimeout(() => dispatch(onAnchorChange(anchor)), 0);
            }

            return;
        }

        dispatch(onLocationChange({ pathname, hash, anchor }));
        if (route?.isForegroundApp) {
            dispatch(lockRouter(true));

            if (route.clearUrl) {
                asSuiteRouterHistory(extra.services).suiteRouterHistory.navigate({ pathname });
            }

            return;
        }

        asSuiteRouterHistory(extra.services).suiteRouterHistory.navigate({ pathname, hash });
    },
);

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
export const closeModalApp = createThunk(
    '@router/closeModalApp',
    (preserveParams: boolean | undefined, { dispatch, extra }) => {
        const shouldPreserveParams = preserveParams ?? true;
        dispatch(lockRouter(false));

        const location = asSuiteRouterHistory(extra.services).suiteRouterHistory.getLocation();
        const route = findRoute(location.pathname);

        if (route && route.isForegroundApp) {
            return dispatch(goto({ routeName: 'suite-index' }));
        }

        if (!shouldPreserveParams && location.hash.length > 0) {
            asSuiteRouterHistory(extra.services).suiteRouterHistory.navigate({
                pathname: location.pathname,
            });
        } else {
            dispatch(onLocationChange(location));
        }
    },
);
