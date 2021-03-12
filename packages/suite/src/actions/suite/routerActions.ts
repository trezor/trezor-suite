/**
 * Router actions for 'next/router' used in web and desktop apps
 * Use override for react-native (@trezor/suite-native/src/actions)
 */
import Router from 'next/router';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE, ROUTER } from '@suite-actions/constants';
import {
    getPrefixedURL,
    getRoute,
    findRoute,
    findRouteByName,
    RouteParams,
} from '@suite-utils/router';
import { Dispatch, GetState, Route } from '@suite-types';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    url: string;
}

export type RouterAction = LocationChange;

/**
 * Dispatch initial url
 * Called from `@suite-middlewares/suiteMiddleware`
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    // check if location was not already changed by initialRedirection
    if (getState().router.app === 'unknown') {
        const url = Router.pathname + window.location.hash;
        dispatch({
            type: ROUTER.LOCATION_CHANGE,
            url,
        });
    }
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
 * Handle changes of window.location and window.location.hash
 * Called from ./support/RouterHandler
 * @param {string} url
 */
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const unlocked = dispatch(onBeforePopState());
    if (!unlocked) return;
    const { router } = getState();
    if (router.pathname === url) return null;
    // TODO: check if the view is not locked by the device request

    return dispatch({
        type: ROUTER.LOCATION_CHANGE,
        url,
    });
};

// links inside of application
export const goto = (
    routeName: Route['name'],
    params?: RouteParams,
    preserveParams = false,
) => async (dispatch: Dispatch, getState: GetState) => {
    const hasRouterLock = getState().suite.locks.includes(SUITE.LOCK_TYPE.ROUTER);
    if (hasRouterLock) {
        dispatch(suiteActions.lockRouter(false));
    }
    const unlocked = dispatch(onBeforePopState());
    if (!unlocked) return;

    const url = getRoute(routeName, params);
    const route = findRouteByName(routeName);
    if (route && route.isModal) {
        dispatch(onLocationChange(url));
        dispatch(suiteActions.lockRouter(true));
        return;
    }

    if (preserveParams) {
        const { hash } = window.location;
        await Router.push(url + hash, getPrefixedURL(url) + hash);
    } else {
        await Router.push(url, getPrefixedURL(url));
    }
};

/**
 * Used only in application modal.
 * Returns Route of application beneath the application modal. (real nextjs/Router value)
 */
export const getBackgroundRoute = () => () => findRoute(Router.pathname + window.location.hash);

/**
 * Used only in application modal.
 * Application modal does not push route into router history, it changes it only in reducer (see goto action).
 * Reverse operation (again without touching history) needs to be done in back action.
 */
export const closeModalApp = (preserveParams = true) => async (dispatch: Dispatch) => {
    dispatch(suiteActions.lockRouter(false));
    // const route = findRoute(Router.pathname + window.location.hash);
    const route = dispatch(getBackgroundRoute());

    // if user enters route of modal app manually, back would redirect him again to the same route and he would remain stuck
    // so we need a fallback to suite-index
    if (route && route.isModal) {
        return dispatch(goto('suite-index'));
    }

    if (!preserveParams && window.location.hash.length > 0) {
        await Router.push(Router.pathname, getPrefixedURL(Router.pathname));
    } else {
        // + window.location.hash is here to preserve params (eg nth account)
        dispatch(onLocationChange(Router.pathname + window.location.hash));
    }
};

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to requested modal app or welcome screen if `suite.flags.initialRun` is set to true
 */
export const initialRedirection = () => async (dispatch: Dispatch, getState: GetState) => {
    const route = findRoute(Router.pathname + window.location.hash);
    const { initialRun } = getState().suite.flags;

    if (route && route.isModal) {
        await dispatch(goto(route.name));
    } else if (route && initialRun) {
        // only do initial redirection of route is valid
        await dispatch(goto('onboarding-index'));
    }
    // otherwise do nothing -> just show 404 page
};
