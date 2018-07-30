/* @flow */


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
    TrezorDevice,
} from '~/flowtype';

/**
 * Middleware used for init application and managing router path.
 */

const pathToParams = (path: string): RouterLocationState => {
    const urlParts: Array<string> = path.split('/').slice(1);
    const params: RouterLocationState = {};
    if (urlParts.length < 1 || path === '/') return params;

    for (let i = 0, len = urlParts.length; i < len; i += 2) {
        params[urlParts[i]] = urlParts[i + 1] || urlParts[i];
    }

    if (params.hasOwnProperty('device')) {
        const isClonedDevice: Array<string> = params.device.split(':');
        if (isClonedDevice.length > 1) {
            params.device = isClonedDevice[0];
            params.deviceInstance = isClonedDevice[1];
        }
    }

    return params;
};

const validation = (api: MiddlewareAPI, params: RouterLocationState): boolean => {
    if (params.hasOwnProperty('device')) {
        const { devices } = api.getState();

        let device: ?TrezorDevice;
        if (params.hasOwnProperty('deviceInstance')) {
            device = devices.find(d => d.features && d.features.device_id === params.device && d.instance === parseInt(params.deviceInstance));
        } else {
            device = devices.find(d => d.path === params.device || (d.features && d.features.device_id === params.device));
        }

        if (!device) return false;
    }

    if (params.hasOwnProperty('network')) {
        const { config } = api.getState().localStorage;
        const coin = config.coins.find(coin => coin.network === params.network);
        if (!coin) return false;
        if (!params.account) return false;
    }

    if (params.account) {

    }

    return true;
};

let __unloading: boolean = false;

const LandingURLS: Array<string> = [
    '/',
    '/bridge',
];

const RouterService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {
    if (action.type === WALLET.ON_BEFORE_UNLOAD) {
        __unloading = true;
    } else if (action.type === LOCATION_CHANGE && !__unloading) {
        const { location } = api.getState().router;
        const web3 = api.getState().web3;
        const { devices } = api.getState();
        const { error } = api.getState().connect;

        const requestedParams: RouterLocationState = pathToParams(action.payload.pathname);
        const currentParams: RouterLocationState = pathToParams(location ? location.pathname : '/');
        const postActions: Array<Action> = [];

        let redirectPath: ?string;
        // first event after application loads
        if (!location) {
            postActions.push({
                type: WALLET.SET_INITIAL_URL,
                pathname: action.payload.pathname,
                state: requestedParams,
            });

            redirectPath = '/';
        } else {
            const isModalOpened: boolean = api.getState().modal.opened;
            // if web3 wasn't initialized yet or there are no devices attached or initialization error occurs
            const landingPage: boolean = web3.length < 1 || devices.length < 1 || error !== null;

            // modal is still opened and currentPath is still valid
            // example 1 (valid blocking): url changes while passphrase modal opened but device is still connected (we want user to finish this action)
            // example 2 (invalid blocking): url changes while passphrase modal opened because device disconnect
            if (isModalOpened && action.payload.pathname !== location.pathname && validation(api, currentParams)) {
                redirectPath = location.pathname;
                console.warn('Modal still opened');
            } else if (landingPage) {
                // keep route on landing page
                if (action.payload.pathname !== '/' && action.payload.pathname !== '/bridge') {
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
                    if (requestedParams.network !== currentParams.network) {
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

        if (redirectPath) {
            console.warn('Redirecting...', redirectPath);
            // override action to keep routerReducer sync
            const url: string = redirectPath;
            action.payload.state = pathToParams(url);
            action.payload.pathname = url;
            // change url
            api.dispatch(replace(url));
        } else {
            action.payload.state = requestedParams;
        }

        // resolve LOCATION_CHANGE action
        next(action);

        // resolve post actions
        postActions.forEach((a) => {
            api.dispatch(a);
        });

        api.dispatch(NotificationActions.clear(currentParams, requestedParams));

        return action;
    }

    // Pass all actions through by default
    return next(action);
};

export default RouterService;