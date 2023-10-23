/**
 * Use override for react-native (@suite-native/app/src/actions)
 */
import { Route } from '@suite-common/suite-types';

import * as suiteActions from 'src/actions/suite/suiteActions';
import { SUITE, ROUTER } from 'src/actions/suite/constants';
import { RouterAppWithParams, SettingsBackRoute } from 'src/constants/suite/routes';
import {
    getAppWithParams,
    getPrefixedURL,
    getRoute,
    getBackgroundRoute,
    findRoute,
    findRouteByName,
    RouteParams,
} from 'src/utils/suite/router';
import { Dispatch, GetState } from 'src/types/suite';
import history from 'src/support/history';
import type { AnchorType } from 'src/constants/suite/anchors';

export type RouterAction =
    | {
          type: typeof ROUTER.LOCATION_CHANGE;
          payload: {
              url: string;
              pathname: string;
              hash?: string;
              settingsBackRoute?: SettingsBackRoute;
              anchor?: AnchorType;
          } & RouterAppWithParams;
      }
    | {
          type: typeof ROUTER.ANCHOR_CHANGE;
          payload: AnchorType;
      };

/**
 * Handle Router.beforePopState action (back)
 * Called from ./support/RouterHandler
 */
export const onBeforePopState = () => (_dispatch: Dispatch, getState: GetState) => {
    const { locks } = getState().suite;
    const isLocked = locks.includes(SUITE.LOCK_TYPE.ROUTER) || locks.includes(SUITE.LOCK_TYPE.UI);
    const hasActionModal = getState().modal.context !== '@modal/context-none';
    return !isLocked && !hasActionModal;
};

/**
 * Handle changes of history.location and history.location.hash
 * Called from ./support/RouterHandler
 * @param {string} url
 */
export const onLocationChange =
    (url: string, anchor?: AnchorType) => (dispatch: Dispatch, getState: GetState) => {
        const unlocked = dispatch(onBeforePopState());
        if (!unlocked) return;
        const { router } = getState();
        if (router.url === url && router.app !== 'unknown') return null;
        // TODO: check if the view is not locked by the device request

        const [pathname, hash] = url.split('#');

        const appWithParams = getAppWithParams(url);

        return dispatch({
            type: ROUTER.LOCATION_CHANGE,
            payload: {
                url,
                pathname,
                hash,
                anchor,
                ...appWithParams,
            },
        });
    };

// if anchor param is not set, it works as reset
export const onAnchorChange = (anchor?: AnchorType) => (dispatch: Dispatch, _getState: GetState) =>
    dispatch({
        type: ROUTER.ANCHOR_CHANGE,
        payload: anchor,
    });

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    // check if location was not already changed by initialRedirection
    if (getState().router.app === 'unknown') {
        const url = history.location.pathname + history.location.hash;
        dispatch(onLocationChange(url));
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
    (dispatch: Dispatch, getState: GetState) => {
        const { params, preserveParams, anchor } = options;

        const { suite, router } = getState();
        const hasRouterLock = suite.locks.includes(SUITE.LOCK_TYPE.ROUTER);
        if (hasRouterLock) {
            dispatch(suiteActions.lockRouter(false));
        }
        const unlocked = dispatch(onBeforePopState());
        if (!unlocked) return;

        const urlBase = getPrefixedURL(getRoute(routeName, params));

        if (urlBase === router.url) {
            // if location is same, but anchor is set (e.g. click on tor icon when in app settings), let's propagate it to redux state
            if (anchor) {
                // postpone propagation to allow clearing anchor in redux state by click listener
                setTimeout(() => dispatch(onAnchorChange(anchor)), 0);
            }
            return;
        }
        const newUrl = `${urlBase}${preserveParams ? history.location.hash : ''}`;
        dispatch(onLocationChange(newUrl, anchor));

        const route = findRouteByName(routeName);

        if (route?.isForegroundApp) {
            dispatch(suiteActions.lockRouter(true));
            return;
        }

        history.push(newUrl);
    };

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
export const closeModalApp =
    (preserveParams = true) =>
    (dispatch: Dispatch) => {
        dispatch(suiteActions.lockRouter(false));

        const route = getBackgroundRoute();

        // if user enters route of modal app manually, back would redirect him again to the same route and he would remain stuck
        // so we need a fallback to suite-index
        if (route && route.isForegroundApp) {
            return dispatch(goto('suite-index'));
        }

        if (!preserveParams && history.location.hash.length > 0) {
            history.push(getPrefixedURL(history.location.pathname));
        } else {
            // + history.location.hash is here to preserve params (eg nth account)
            dispatch(onLocationChange(history.location.pathname + history.location.hash));
        }
    };

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to requested modal app or welcome screen if `suite.flags.initialRun` is set to true
 */
export const initialRedirection = () => (dispatch: Dispatch, getState: GetState) => {
    const route = findRoute(history.location.pathname + history.location.hash);

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
};
