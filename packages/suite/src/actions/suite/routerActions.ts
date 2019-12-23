/**
 * Router actions for 'next/router' used in web and desktop apps
 * Use override for react-native (@trezor/suite-native/src/actions)
 */
import Router from 'next/router';
import { Route } from '@suite-constants/routes';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { getPrefixedURL, getRoute, findRouteByName, RouteParams } from '@suite-utils/router';
import { Dispatch, GetState } from '@suite-types';

interface LocationChange {
    type: typeof ROUTER.LOCATION_CHANGE;
    url: string;
}

export type RouterActions = LocationChange;

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
 * @param {string} url
 */
export const onBeforePopState = () => (_dispatch: Dispatch, getState: GetState) => {
    const { locks } = getState().suite;
    return !locks.includes(SUITE.LOCK_TYPE.ROUTER) && !locks.includes(SUITE.LOCK_TYPE.UI);
};

/**
 * Handle changes of window.location and window.location.hash
 * Called from ./support/RouterHandler
 * @param {string} url
 */
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const unlocked = dispatch(onBeforePopState());
    console.log('unlocked2', unlocked);
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
) => async (dispatch: Dispatch) => {
    const unlocked = dispatch(onBeforePopState());
    console.log('unlocked', unlocked);

    if (!unlocked) return;
    
    const url = getRoute(routeName, params);

    if (findRouteByName(routeName).isModal) {
        return dispatch(onLocationChange(url));
    }

    if (preserveParams) {
        const { hash } = window.location;
        await Router.push(url + hash, getPrefixedURL(url) + hash);
    } else {
        await Router.push(url, getPrefixedURL(url));
    }
};

export const back = () => {
    Router.back();
};

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to onboarding if `suite.initialRun` is set to true
 */
export const initialRedirection = () => async (dispatch: Dispatch, getState: GetState) => {
    const { initialRun } = getState().suite;
    const unlocked = dispatch(onBeforePopState());
    if (initialRun && unlocked) {
        await dispatch(goto('onboarding-index'));
    }
};
