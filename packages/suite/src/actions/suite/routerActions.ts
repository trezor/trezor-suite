/**
 * Use override for react-native (@suite-native/app/src/actions)
 */

import { lockRouter, selectIsRouterLocked, selectIsRouterOrUiLocked } from '@suite/locks';
import {
    type AnchorType,
    RouteParams,
    RouterAppWithParams,
    RouterPathOptional,
    SettingsBackRoute,
    anchorChange,
    routerLocationChange,
    selectRouter,
    selectRouterApp,
    selectRouterHash,
} from '@suite/router';
import {
    findRoute,
    getAppWithParams,
    getRoute,
    getRouteHash,
    isEqualLocation,
} from '@suite/router';
import { ExtraDependencies, createThunk } from '@suite-common/redux-utils';
import { Route } from '@suite-common/suite-types';

import { asSuiteServices } from 'src/support/extraDependencies';
import { Dispatch, GetState } from 'src/types/suite';

export type RouterAction =
    | {
          type: typeof routerLocationChange.type;
          payload: RouterPathOptional & {
              anchor?: AnchorType;
              settingsBackRoute?: SettingsBackRoute;
          } & RouterAppWithParams;
      }
    | {
          type: typeof anchorChange.type;
          payload: AnchorType | undefined;
      };

/**
 * Handle Router.beforePopState action (back)
 * Called from ./support/RouterHandler
 */
export const onBeforePopState = () => (_dispatch: Dispatch, getState: GetState) => {
    const isLocked = selectIsRouterOrUiLocked(getState());
    const hasActionModal = getState().modal.context !== '@modal/context-none';

    return !isLocked && !hasActionModal;
};

/**
 * Handle changes of history.location and history.location.hash
 * Called from ./support/RouterHandler
 */
export const onLocationChange =
    (location: RouterPathOptional & { anchor?: AnchorType }) =>
    (dispatch: Dispatch, getState: GetState) => {
        const unlocked = dispatch(onBeforePopState());
        const router = selectRouter(getState());
        if (!unlocked && router.loaded) return;

        if (isEqualLocation(router, location) && router.app !== 'unknown') {
            return null;
        }

        // TODO: check if the view is not locked by the device request
        const appWithParams = getAppWithParams(location);

        return dispatch(routerLocationChange({ ...location, ...appWithParams }));
    };

// if anchor param is not set, it works as reset
export const onAnchorChange = (anchor?: AnchorType) => (dispatch: Dispatch, _getState: GetState) =>
    dispatch(anchorChange(anchor));

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const init = () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
    // check if location was not already changed by initialRedirection
    if (selectRouterApp(getState()) === 'unknown') {
        const location = asSuiteServices(extra.services).suiteRouterHistory.getLocation();
        dispatch(onLocationChange(location));
    }
};

// links inside of application
export const goto =
    (
        routeName: Route['name'],
        options: {
            params?: RouteParams;
            preserveParams?: boolean;
            anchor?: AnchorType;
        } = {},
    ) =>
    (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { params, preserveParams, anchor } = options;

        const state = getState();
        const hasRouterLock = selectIsRouterLocked(state);

        if (hasRouterLock) {
            dispatch(lockRouter(false));
        }
        const unlocked = dispatch(onBeforePopState());

        if (!unlocked) return;

        const route = getRoute(routeName);
        const newHash = getRouteHash(route, params);
        const pathname = route?.pattern || '/';
        const hash = preserveParams ? selectRouterHash(state) : (newHash ?? '');

        if (isEqualLocation(selectRouter(state), { pathname, hash, search: '' })) {
            // if location is same, but anchor is set (e.g. click on tor icon when in app settings), let's propagate it to redux state
            if (anchor) {
                // postpone propagation to allow clearing anchor in redux state by click listener
                setTimeout(() => dispatch(onAnchorChange(anchor)), 0);
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
                asSuiteServices(extra.services).suiteRouterHistory.navigate({ pathname });
            }

            return;
        }

        asSuiteServices(extra.services).suiteRouterHistory.navigate({ pathname, hash });
    };

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
export const closeModalApp =
    (preserveParams = true) =>
    (dispatch: Dispatch, _: GetState, extra: ExtraDependencies) => {
        dispatch(lockRouter(false));

        const location = asSuiteServices(extra.services).suiteRouterHistory.getLocation();
        const route = findRoute(location.pathname);

        // if user enters route of modal app manually, back would redirect him again to the same route and he would remain stuck
        // so we need a fallback to suite-index
        if (route && route.isForegroundApp) {
            return dispatch(goto('suite-index'));
        }

        if (!preserveParams && location.hash.length > 0) {
            asSuiteServices(extra.services).suiteRouterHistory.navigate({
                pathname: location.pathname,
            });
        } else {
            // + history.location.hash is here to preserve params (e.g. nth account)
            dispatch(onLocationChange(location));
        }
    };

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to requested modal app or welcome screen if `suite.flags.initialRun` is set to true
 */
export const initialRedirection = createThunk(
    '@suite/initial-redirection',
    (_, { dispatch, getState, extra }) => {
        const location = asSuiteServices(extra.services).suiteRouterHistory.getLocation();
        const route = findRoute(location.pathname);

        const { initialRun } = getState().suite.flags;
        // only do initial redirection of route is valid
        // otherwise do nothing -> just show 404 page
        if (!route) {
            return;
        }

        if (route.isForegroundApp) {
            dispatch(goto(route.name));
        } else if (initialRun) {
            dispatch(goto('suite-start'));
        }
    },
);
