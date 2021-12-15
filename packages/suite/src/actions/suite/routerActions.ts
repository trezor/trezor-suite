/**
 * Use override for react-native (@trezor/suite-native/src/actions)
 */
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { RouterAppWithParams, SettingsBackRoute } from '@suite-constants/routes';
import {
    getAppWithParams,
    getPrefixedURL,
    getRoute,
    findRoute,
    findRouteByName,
    RouteParams,
} from '@suite-utils/router';
import { Dispatch, GetState, Route } from '@suite-types';
import history from '@suite/support/history';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    payload: {
        url: string;
        pathname: string;
        hash?: string;
        settingsBackRoute?: SettingsBackRoute;
    } & RouterAppWithParams;
}

export type RouterAction = LocationChange;

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
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const unlocked = dispatch(onBeforePopState());
    if (!unlocked) return;
    const { router } = getState();
    if (router.pathname === url && router.app !== 'unknown') return null;
    // TODO: check if the view is not locked by the device request

    const [pathname, hash] = url.split('#');

    const appWithParams = getAppWithParams(url);

    return dispatch({
        type: ROUTER.LOCATION_CHANGE,
        payload: {
            url,
            pathname,
            hash,
            ...appWithParams,
        },
    });
};

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
    (routeName: Route['name'], params?: RouteParams, preserveParams = false) =>
    (dispatch: Dispatch, getState: GetState) => {
        const { suite, router } = getState();
        const hasRouterLock = suite.locks.includes(SUITE.LOCK_TYPE.ROUTER);
        if (hasRouterLock) {
            dispatch(suiteActions.lockRouter(false));
        }
        const unlocked = dispatch(onBeforePopState());
        if (!unlocked) return;

        const urlBase = getPrefixedURL(getRoute(routeName, params));
        if (urlBase === router.url) return;

        const newUrl = `${urlBase}${preserveParams ? history.location.hash : ''}`;
        dispatch(onLocationChange(newUrl));

        const route = findRouteByName(routeName);
        if (route?.isForegroundApp) {
            dispatch(suiteActions.lockRouter(true));
            return;
        }

        history.push(newUrl);
    };

/**
 * Used only in application modal.
 * Returns Route of application beneath the application modal. (real Router value)
 */
export const getBackgroundRoute = () => () =>
    findRoute(history.location.pathname + history.location.hash);

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
export const closeModalApp =
    (preserveParams = true) =>
    (dispatch: Dispatch) => {
        dispatch(suiteActions.lockRouter(false));

        const route = dispatch(getBackgroundRoute());

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
export const initialRedirection = () => async (dispatch: Dispatch, getState: GetState) => {
    const route = findRoute(history.location.pathname + history.location.hash);
    const { initialRun } = getState().suite.flags;

    if (route && route.isForegroundApp) {
        await dispatch(goto(route.name));
    } else if (route && initialRun) {
        // only do initial redirection of route is valid
        await dispatch(goto('onboarding-index'));
    }
    // otherwise do nothing -> just show 404 page
};
