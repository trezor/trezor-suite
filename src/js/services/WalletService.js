/* @flow */


import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from '../actions/constants/wallet';
import * as SEND from '../actions/constants/wallet';

import * as WalletActions from '../actions/WalletActions';
import * as LocalStorageActions from '../actions/LocalStorageActions';
import * as TrezorConnectActions from '../actions/TrezorConnectActions';
import * as SelectedAccountActions from '../actions/SelectedAccountActions';

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
            // load data from config.json and local storage
            api.dispatch(LocalStorageActions.loadData());
        }
    }

    // pass action
    next(action);

    if (action.type === DEVICE.CONNECT) {
        api.dispatch(WalletActions.clearUnavailableDevicesData(prevState, action.device));
    }

    // update common values in WallerReducer
    api.dispatch(WalletActions.updateSelectedValues(prevState, action));

    // update common values in SelectedAccountReducer
    api.dispatch(SelectedAccountActions.updateSelectedValues(prevState, action));

    // selected device changed
    if (action.type === WALLET.SET_SELECTED_DEVICE) {
        if (action.device) {
            api.dispatch(TrezorConnectActions.getSelectedDeviceState());
        } else {
            api.dispatch(TrezorConnectActions.switchToFirstAvailableDevice());
        }
    }

    return action;
};

export default WalletService;