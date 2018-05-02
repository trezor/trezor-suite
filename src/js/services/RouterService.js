/* @flow */
'use strict';

import pathToRegexp from 'path-to-regexp';
import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE, push, replace } from 'react-router-redux';
import * as CONNECT from '../actions/constants/TrezorConnect';
import * as WALLET from '../actions/constants/wallet';
import * as NotificationActions from '../actions/NotificationActions';

import type { 
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    ThunkAction,
    AsyncAction,
    GetState,
    RouterLocationState,
    TrezorDevice
} from '../flowtype';

/**
 * Middleware used for init application and managing router path.
 */

const pathToParams = (path: string): RouterLocationState => {
    const urlParts: Array<string> = path.split("/").slice(1);
    const params: RouterLocationState = {};
    if (urlParts.length < 1 || path === "/") return params;
    
    for (let i = 0, len = urlParts.length; i < len; i+=2) {
        params[ urlParts[i] ] = urlParts[ i + 1 ];
    }

    if (params.hasOwnProperty('device')) {
        const isClonedDevice: Array<string> = params.device.split(':');
        if (isClonedDevice.length > 1) {
            params.device = isClonedDevice[0];
            params.deviceInstance = isClonedDevice[1];
        }
    }

    return params;
}

const validation = (api: MiddlewareAPI, params: RouterLocationState): boolean => {

    if (params.hasOwnProperty('device')) {
        const { devices } = api.getState().connect;

        let device: ?TrezorDevice;
        if (params.hasOwnProperty('deviceInstance')) {
            device = devices.find(d => d.features && d.features.device_id === params.device && d.instance === parseInt(params.deviceInstance ) );
        } else {
            device = devices.find(d => d.path === params.device || (d.features && d.features.device_id === params.device));
        }

        if (!device) return false;
    }

    if (params.hasOwnProperty('network')) {
        const { config } = api.getState().localStorage;
        const coin = config.coins.find(coin => coin.network === params.network);
        if (!coin) return false;
        if (!params.address) return false;
    }

    if (params.address) {

    }

    return true;
}

let __unloading: boolean = false;

const LandingURLS: Array<string> = [
    '/',
    '/bridge'
];

const RouterService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {

    if (action.type === WALLET.ON_BEFORE_UNLOAD) {
        __unloading = true;
    } else if (action.type === LOCATION_CHANGE && !__unloading) {

        const { location } = api.getState().router;
        const web3 = api.getState().web3;
        const { devices, error } = api.getState().connect;

        const requestedParams: RouterLocationState = pathToParams(action.payload.pathname);
        const currentParams: RouterLocationState = pathToParams(location ? location.pathname : '/');

        let redirectPath: ?string;
        // first event after application loads
        if (!location) {

            api.dispatch({
                type: WALLET.SET_INITIAL_URL,
                pathname: action.payload.pathname, 
                state: requestedParams
            });

            redirectPath = '/';

            //return next(action);
        } else {

            const isModalOpened: boolean = api.getState().modal.opened;
            // if web3 wasn't initialized yet or there are no devices attached or initialization error occurs
            const landingPage: boolean = web3.length < 1 || devices.length < 1 || error !== null;

            if (isModalOpened && action.payload.pathname !== location.pathname) {
                redirectPath = location.pathname;
                console.warn("Modal still opened");
            } else if (landingPage) {
                // keep route on landing page
                if (action.payload.pathname !== '/' && action.payload.pathname !== '/bridge'){
                    redirectPath = '/';
                }
            } else {
                // PATH VALIDATION
                // redirect from root view
                if (action.payload.pathname === '/' || !validation(api, requestedParams)) {
                    // TODO: switch to first device?
                    // redirectPath = `/device/${ devices[0].path }`;
                    redirectPath = location.pathname;
                } else if (requestedParams.device) {

                    if (currentParams.device !== requestedParams.device || currentParams.deviceInstance !== requestedParams.deviceInstance) {
                        api.dispatch({
                            type: CONNECT.SELECT_DEVICE,
                            payload: {
                                id: requestedParams.device,
                                instance: requestedParams.deviceInstance ? parseInt(requestedParams.deviceInstance) : undefined
                            }
                        });
                    }

                    if (requestedParams.network !== currentParams.network) {
                        api.dispatch({
                            type: CONNECT.COIN_CHANGED,
                            payload: {
                                network: requestedParams.network
                            }
                        });
                    }
                }
            }
        }

        if (redirectPath) {
            console.warn("Redirecting...")
            // override action to keep routerReducer sync
            const url: string = redirectPath;
            action.payload.state = pathToParams(url);
            action.payload.pathname = url;
            // change url
            api.dispatch( replace(url) );
        } else {
            action.payload.state = requestedParams;
        }

        api.dispatch( NotificationActions.clear(currentParams, requestedParams) );
    }

    // Pass all actions through by default
    return next(action);
};

export default RouterService;