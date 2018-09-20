/* @flow */
import { LOCATION_CHANGE, replace } from 'react-router-redux';
import * as CONNECT from 'actions/constants/TrezorConnect';
import * as WALLET from 'actions/constants/wallet';
import * as NotificationActions from 'actions/NotificationActions';
import * as RouterActions from 'actions/RouterActions';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
    ThunkAction,
    RouterLocationState,
    TrezorDevice,
} from 'flowtype';

/*
const validation = (api: MiddlewareAPI, params: RouterLocationState): boolean => {
    if (params.hasOwnProperty('device')) {
        const { devices } = api.getState();

        let device: ?TrezorDevice;
        if (params.hasOwnProperty('deviceInstance')) {
            device = devices.find(d => d.features && d.features.device_id === params.device && d.instance === parseInt(params.deviceInstance, 10));
        } else {
            device = devices.find(d => d.path === params.device || (d.features && d.features.device_id === params.device));
        }

        if (!device) return false;
    }

    if (params.hasOwnProperty('network')) {
        const { config } = api.getState().localStorage;
        const coin = config.coins.find(c => c.network === params.network);
        if (!coin) return false;
        if (!params.account) return false;
    }

    // if (params.account) {

    // }

    return true;
};
*/

const deviceModeValidation = (api: MiddlewareAPI, current: RouterLocationState, requested: RouterLocationState): boolean => {
    // allow url change if requested device is not the same as current state
    if (current.device !== requested.device) return true;
    // find device
    const { devices } = api.getState();
    let device: ?TrezorDevice;
    if (requested.hasOwnProperty('deviceInstance')) {
        device = devices.find(d => d.features && d.features.device_id === requested.device && d.instance === parseInt(requested.deviceInstance, 10));
    } else {
        device = devices.find(d => d.path === requested.device || (d.features && d.features.device_id === requested.device));
    }
    if (!device) return false;
    if (!device.features) return false;
    if (device.firmware === 'required') return false;

    return true;
}

/**
 * Redux Middleware used for managing router path
 * This middleware couldn't use async/await because LOCATION_CHANGE action is also synchronized with RouterReducer (react-router-redux)
 */
const RouterService1: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    if (action.type !== LOCATION_CHANGE) {
        return next(action);
    }

    action.payload.state = api.dispatch( RouterActions.pathToParams(action.payload.pathname) );

    next(action);

    return action;
}

const RouterService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    // make sure that middleware should process this action
    if (action.type !== LOCATION_CHANGE || api.getState().wallet.unloading) {
        // Pass action through by default
        return next(action);
    }

    const { location } = api.getState().router;
    const requestedUrl: string = action.payload.pathname;
    // map current and incoming url into RouterLocationState object
    const currentParams = api.dispatch( RouterActions.pathToParams(location ? location.pathname : '/') );
    const requestedParams = api.dispatch( RouterActions.pathToParams(requestedUrl) );
    // postActions will be dispatched AFTER propagation of LOCATION_CHANGE action using next(action) below
    const postActions: Array<Action | ThunkAction> = [];
    const urlChanged: boolean = location ? requestedUrl !== location.pathname : true;
    let redirectUrl: ?string;

    if (!location) {
        // handle first url change
        // store requested url in WalletReducer and try to redirect back there if possible after application is ready
        // TODO: validate if initial url is potentially correct
        postActions.push({
            type: WALLET.SET_INITIAL_URL,
            pathname: action.payload.pathname,
            state: requestedParams,
        });
        // temporary redirect to landing page (loading screen)
        // and wait until application is ready
        redirectUrl = '/';
    } else {
        const { devices } = api.getState();
        const { ready } = api.getState().wallet;
        const { error } = api.getState().connect;
        const isModalOpened: boolean = api.getState().modal.opened;
        // there are no connected devices or application isn't ready or initialization error occurred
        const shouldDisplayLandingPage: boolean = devices.length < 1 || !ready || error !== null;
        const isLandingPageUrl = api.dispatch( RouterActions.isLandingPageUrl(requestedUrl) );
        const currentParamsAreValid: boolean = api.dispatch( RouterActions.paramsValidation(currentParams) );

        if (isModalOpened && urlChanged && currentParamsAreValid) {
            // Corner case: modal is opened and currentParams are still valid
            // example 1 (valid blocking): url changed while passphrase modal opened but device is still connected (we want user to finish this action)
            // example 2 (invalid blocking): url changes while passphrase modal opened because device disconnect
            redirectUrl = location.pathname;
            console.warn('Modal still opened');
        } else if (shouldDisplayLandingPage) {
            if (!isLandingPageUrl) {
                // keep route on landing page
                redirectUrl = '/';
            }
        } else {
            // Process regular url change during application live cycle
            const requestedParamsAreValid: boolean = api.dispatch( RouterActions.paramsValidation(requestedParams) );
            if (isLandingPageUrl) {
                // Corner case: disallow displaying landing page
                // redirect to previous url
                // TODO:  && currentParamsAreValid
                redirectUrl = location.pathname;
            } else if (!requestedParamsAreValid) {
                // Corner case: requested params are not valid
                // Neither device or network doesn't exists
                postActions.push( RouterActions.selectFirstAvailableDevice() );
            } else if (requestedParams.device) {
                if (!deviceModeValidation(api, currentParams, requestedParams)) {
                    redirectUrl = location.pathname;
                    console.warn('Device is not in valid mode');
                } else if (requestedParams.network !== currentParams.network) {
                    postActions.push({
                        type: CONNECT.COIN_CHANGED,
                        payload: {
                            network: requestedParams.network,
                        },
                    });
                }
            }
        }
    }

    if (redirectUrl) {
        const url: string = redirectUrl;
        // override action to keep RouterReducer synchronized
        action.payload.state = api.dispatch( RouterActions.pathToParams(url) );
        // change url 
        if (requestedUrl !== url) {
            console.warn('Redirecting from', requestedUrl, 'to', url);
            action.payload.pathname = url;
            postActions.unshift( replace(url) )
        }
    } else {
        // override action to keep RouterReducer synchronized
        action.payload.state = requestedParams;
    }

    // resolve LOCATION_CHANGE action
    next(action);

    // resolve all post actions
    postActions.forEach((a) => {
        api.dispatch(a);
    });

    // TODO: move this to wallet service?
    api.dispatch(NotificationActions.clear(currentParams, requestedParams));

    return action;

};

export default RouterService;