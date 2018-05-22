/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from '../actions/constants/wallet';

import * as WalletActions from '../actions/WalletActions';
import * as LocalStorageActions from '../actions/LocalStorageActions';

import type { 
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    State,
    Dispatch,
    Action,
    GetState,
    TrezorDevice,
} from '~/flowtype';


const getSelectedDevice = (state: State): ?TrezorDevice => {
    const locationState = state.router.location.state;
    if (!locationState.device) return null;

    const instance: ?number = locationState.deviceInstance ? parseInt(locationState.deviceInstance) : undefined;
    return state.connect.devices.find(d => {
        if (d.unacquired && d.path === locationState.device) {
            return true;
        } else if (d.features && d.features.bootloader_mode && d.path === locationState.device) {
            return true;
        } else if (d.features && d.features.device_id === locationState.device && d.instance === instance) {
            return true;
        }
        return false;
    });
}

/**
 * Middleware 
 */
const WalletService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => (action: Action): Action => {

    const prevState = api.getState();
    const locationChange: boolean = action.type === LOCATION_CHANGE;

    // Application live cycle starts here
    if (locationChange) {
        const { location } = api.getState().router;
        if (!location) {
            api.dispatch( WalletActions.init() );
            // load data from config.json and local storage
            api.dispatch( LocalStorageActions.loadData() );
        }
    }

    // pass action 
    next(action);

    const state = api.getState();

    // listening devices state change
    if (locationChange || prevState.connect.devices !== state.connect.devices) {
        const device = getSelectedDevice(state);
        if (state.wallet.selectedDevice !== device) {
            api.dispatch({
                type: WALLET.SET_SELECTED_DEVICE,
                device
            })
        }
    }

    return action;
};



export default WalletService;