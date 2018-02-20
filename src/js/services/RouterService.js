/* @flow */
'use strict';

import pathToRegexp from 'path-to-regexp';
import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE, push, replace } from 'react-router-redux';
import { ON_BEFORE_UNLOAD } from '../actions/AppActions';
import * as CONNECT from '../actions/constants/TrezorConnect';

/**
 * Middleware used for init application and managing router path.
 */

 type UrlParams = {[k: string] : string};

const pathToParams = (path: string): UrlParams => {
    const urlParts: Array<string> = path.split("/").slice(1);
    const params: UrlParams = {};
    if (urlParts.length < 1 || path === "/") return params;
    
    for (let i = 0, len = urlParts.length; i < len; i+=2) {
        params[ urlParts[i] ] = urlParts[ i + 1 ];
    }

    if (params.hasOwnProperty('device')) {
        const isClonedDevice: Array<string> = params.device.split(':');
        if (isClonedDevice.length > 1) {
            params.device = isClonedDevice[0];
            params.deviceInstance = parseInt(isClonedDevice[1]);
        }
    }

    return params;
}

const validation = (store: any, params: UrlParams): boolean => {

    if (params.hasOwnProperty('device')) {
        const { devices } = store.getState().connect;

        let device; // = devices.find(d => d.path === params.device || d.features.device_id === params.device);
        if (params.hasOwnProperty('deviceInstance')) {
            device = devices.find(d => d.features && d.features.device_id === params.device && d.instance === params.deviceInstance );
        } else {
            device = devices.find(d => d.path === params.device || (d.features && d.features.device_id === params.device));
        }

        if (!device) return false;
    }

    if (params.hasOwnProperty('coin')) {
        const { config } = store.getState().localStorage;
        const coin = config.coins.find(c => c.symbol === params.coin);
        if (!coin) return false;
        if (!params.address) return false;
    }

    if (params.address) {

    }

    return true;
}

let __unloading: boolean = false;

const RouterService = (store: any) => (next: any) => (action: any) => {

    if (action.type === ON_BEFORE_UNLOAD) {
        __unloading = true;
    } else if (action.type === LOCATION_CHANGE && !__unloading) {

        const { location } = store.getState().router;
        const web3 = store.getState().web3;
        const { devices, error } = store.getState().connect;
        const { opened } = store.getState().modal;

        let redirectPath: ?string;
        // first (initial) event after app loads
        if (!location) {

            action.payload.state = {
                initURL: action.payload.pathname,
                initSearch: action.payload.search
            }

            // check if there are initial parameters in url (coin)
            if (action.payload.search.length > 0) {
                // save it in WalletReducer, after device detection will redirect to this request
                redirectPath = '/';
                //action.payload.initURL = action.payload.location;
            }
        }

        const requestedParams: UrlParams = pathToParams(action.payload.pathname);
        const currentParams: UrlParams = pathToParams(location ? location.pathname : '/');

        // if web3 wasn't initialized yet or there are no devices attached or initialization error occurs
        const landingPage: boolean = web3.length < 1 || devices.length < 1 || error;

        if (opened && action.payload.pathname !== location.pathname) {
            redirectPath = location.pathname;
            console.warn("Modal still opened");
        } else if (landingPage) {
            // keep route on landing page
            if (action.payload.pathname !== '/'){
                redirectPath = '/';
            }
        } else {
            // PATH VALIDATION
            // redirect from root view
            if (action.payload.pathname === '/' || !validation(store, requestedParams)) {
                // TODO: switch to first device?
                // redirectPath = `/device/${ devices[0].path }`;
                redirectPath = location.pathname;
            } else {

                if (currentParams.device !== requestedParams.device || currentParams.deviceInstance !== requestedParams.deviceInstance) {
                    store.dispatch({
                        type: CONNECT.SELECT_DEVICE,
                        payload: {
                            id: requestedParams.device,
                            instance: requestedParams.deviceInstance
                        }
                    });
                }

                if (requestedParams.coin !== currentParams.coin) {
                    store.dispatch({
                        type: CONNECT.COIN_CHANGED,
                        payload: {
                            coin: requestedParams.coin
                        }
                    });
                }
            }
        }

        if (redirectPath) {
            console.warn("Redirecting...")
            // override action to keep routerReducer sync
            action.payload.params = pathToParams(redirectPath);
            action.payload.pathname = redirectPath;
            // change url
            store.dispatch( replace(redirectPath) );
        } else {
            action.payload.params = requestedParams;
        }
        
    }

    // Pass all actions through by default
    next(action);
};

export default RouterService;