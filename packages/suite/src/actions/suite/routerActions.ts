/**
 * Router actions for 'next/router' used in web and desktop apps
 * Use override for react-native (@trezor/suite-native/src/actions)
 */

import Router from 'next/router';
import { getPrefixedURL, getApp, getRoute } from '@suite-utils/router';
import { Dispatch, GetState } from '@suite-types';

export const LOCATION_CHANGE = '@router/location-change';

interface LocationChange {
    type: typeof LOCATION_CHANGE;
    url: string;
}

export type RouterActions = LocationChange;

/**
 * Dispatch initial url
 */
export const init = () => (dispatch: Dispatch, getState: GetState) => {
    // check if location was not already changed by initialRedirection
    if (getState().router.app === 'unknown') {
        const url = Router.pathname + window.location.hash;
        dispatch({
            type: LOCATION_CHANGE,
            url,
        });
    }
};

/**
 * Handle changes of window.location and window.location.hash
 * Called from ./support/RouterHandler
 * @param {string} url
 */
export const onLocationChange = (url: string) => (dispatch: Dispatch, getState: GetState) => {
    const { router } = getState();
    if (router.pathname === url) return null;
    // TODO: check if the view is not locked by the device request

    return dispatch({
        type: LOCATION_CHANGE,
        url,
    });
};

/**
 * Handle Router.beforePopState action
 * Called from ./support/RouterHandler
 * @param {string} url
 */
export const onBeforePopState = () => (_dispatch: Dispatch, getState: GetState) => {
    const { uiLocked, routerLocked } = getState().suite;
    return !uiLocked && !routerLocked;
};

// links inside of application
export const goto = async (url: string, preserveParams: boolean = false) => {
    if (preserveParams) {
        await Router.push(url + window.location.hash, getPrefixedURL(url) + window.location.hash);
    } else {
        await Router.push(url, getPrefixedURL(url));
    }
};

export const back = async () => {
    await Router.back();
};

/**
 * Called from `@suite-middlewares/suiteMiddleware`
 * Redirects to onboarding if `suite.initialRun` is set to true
 */
export const initialRedirection = () => async (_dispatch: Dispatch, getState: GetState) => {
    if (getState().suite.initialRun) {
        const app = getApp(Router.pathname);
        if (app !== 'onboarding') {
            await goto(getRoute('onboarding-index'));
        }
    }
};
