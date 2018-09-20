/* @flow */


import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from 'actions/constants/wallet';
import * as CONNECT from 'actions/constants/TrezorConnect';

import * as WalletActions from 'actions/WalletActions';
import * as RouterActions from 'actions/RouterActions';
import * as NotificationActions from 'actions/NotificationActions';
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
            return next(action);
        }
    }

    // pass action
    next(action);

    switch (action.type) {
        case WALLET.SET_INITIAL_URL:
            api.dispatch(LocalStorageActions.loadData());
            break;
        case WALLET.SET_SELECTED_DEVICE: {
            if (action.device) {
                // try to authorize device
                api.dispatch(TrezorConnectActions.getSelectedDeviceState());
            } else {
                // try select different device
                api.dispatch(RouterActions.selectFirstAvailableDevice());
            }
        }
        break;
        case DEVICE.CONNECT:
            api.dispatch(WalletActions.clearUnavailableDevicesData(prevState, action.device));
            break;
        default: {
            break;
        }
    }

    // update common values ONLY if application is ready
    if (!api.getState().wallet.ready) return action;

    // double verification needed
    // Corner case: LOCATION_CHANGE was called but pathname didn't changed (redirection in RouterService)
    const prevLocation = prevState.router.location;
    const currentLocation = api.getState().router.location;
    if (locationChange && prevLocation.pathname !== currentLocation.pathname) {
        // watch for coin change
        if (prevLocation.state.network !== currentLocation.state.network) {
            api.dispatch({
                type: CONNECT.COIN_CHANGED,
                payload: {
                    network: currentLocation.state.network,
                },
            });
        }

        // watch for account change
        if (prevLocation.state.account !== currentLocation.state.account) {
            api.dispatch(SelectedAccountActions.dispose());
        }

        // clear notifications
        api.dispatch(NotificationActions.clear(prevLocation.state, currentLocation.state));
    }


    // update common values in WallerReducer
    api.dispatch(WalletActions.updateSelectedValues(prevState, action));

    // update common values in SelectedAccountReducer
    api.dispatch(SelectedAccountActions.updateSelectedValues(prevState, action));

    return action;
};

export default WalletService;