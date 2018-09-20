/* @flow */
import { LOCATION_CHANGE, replace } from 'react-router-redux';
import * as WALLET from 'actions/constants/wallet';
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

/**
 * Redux Middleware used for managing router path
 * This middleware couldn't use async/await because LOCATION_CHANGE action is also synchronized with RouterReducer (react-router-redux)
 */

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
                // TODO: make sure that currentParamsAreValid, otherwise selectFirstAvailableDevice
                redirectUrl = location.pathname;
            } else if (!requestedParamsAreValid) {
                // Corner case: requested params are not valid
                // Neither device or network doesn't exists
                redirectUrl = location.pathname;
                // postActions.push( RouterActions.selectFirstAvailableDevice() );
            } else if (requestedParams.device) {
                if (!api.dispatch( RouterActions.deviceModeValidation(currentParams, requestedParams) )) {
                    redirectUrl = location.pathname;
                    console.warn('Device is not in valid mode');
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

    return action;
};

export default RouterService;