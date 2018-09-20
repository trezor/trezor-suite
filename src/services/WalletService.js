/* @flow */


import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from 'actions/constants/wallet';

import * as WalletActions from 'actions/WalletActions';
import * as RouterActions from 'actions/RouterActions';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import * as SelectedAccountActions from 'actions/SelectedAccountActions';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

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
            api.dispatch(WalletActions.init());
        }
    }

    if (action.type === WALLET.SET_INITIAL_URL) {
        // load data from config.json and local storage
        api.dispatch(LocalStorageActions.loadData());
    }

    // pass action
    next(action);

    if (action.type === DEVICE.CONNECT) {
        api.dispatch(WalletActions.clearUnavailableDevicesData(prevState, action.device));
    }

    // update common values ONLY if application is ready
    if (api.getState().wallet.ready) {
        // update common values in WallerReducer
        api.dispatch(WalletActions.updateSelectedValues(prevState, action));

        // update common values in SelectedAccountReducer
        api.dispatch(SelectedAccountActions.updateSelectedValues(prevState, action));
    }

    // handle selected device change
    if (action.type === WALLET.SET_SELECTED_DEVICE) {
        if (action.device) {
            // try to authorize device
            api.dispatch(TrezorConnectActions.getSelectedDeviceState());
        } else {
            // try select different device
            api.dispatch(RouterActions.selectFirstAvailableDevice());
        }
    }

    return action;
};

export default WalletService;