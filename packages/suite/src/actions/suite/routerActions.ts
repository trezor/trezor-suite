/**
 * Router actions for 'next/router' used in web and desktop apps
 * Use override for react-native (@trezor/suite-native/src/actions)
 */

import Router from 'next/router';
import { Dispatch, GetState } from '@suite-types/index';

export const LOCATION_CHANGE = '@router/location-change';
export const UPDATE = '@router/update';

interface LocationChange {
    type: typeof LOCATION_CHANGE;
    url: string;
}

export type RouterActions = LocationChange;

/**
 * Dispatch initial url
 */
export const init = (): LocationChange => {
    const url = Router.pathname + window.location.hash;
    return {
        type: LOCATION_CHANGE,
        url,
    };
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
export const onBeforePopState = () => (_dispatch: Dispatch, _getState: GetState): boolean => {
    const locked = false;
    if (locked) {
        // TODO: do not render if view is locked
        return false;
    }
    return true;
};

// links inside of application
export const goto = (url: string, preserveParams: boolean = false) => {
    if (preserveParams) {
        Router.push(url + window.location.hash);
    } else {
        Router.push(url);
    }
};
