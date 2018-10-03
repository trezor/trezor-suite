/* @flow */
import { DEVICE } from 'trezor-connect';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from 'actions/constants/wallet';
import * as CONNECT from 'actions/constants/TrezorConnect';

import * as WalletActions from 'actions/WalletActions';
import * as NotificationActions from 'actions/NotificationActions';
import * as LocalStorageActions from 'actions/LocalStorageActions';
import * as TrezorConnectActions from 'actions/TrezorConnectActions';
import * as SelectedAccountActions from 'actions/SelectedAccountActions';
import * as SendFormActionActions from 'actions/SendFormActions';

import type {
    Middleware,
    MiddlewareAPI,
    MiddlewareDispatch,
    Action,
} from 'flowtype';

/**
 * Middleware
 */
const WalletService: Middleware = (api: MiddlewareAPI) => (next: MiddlewareDispatch) => async (action: Action): Promise<Action> => {
    const prevState = api.getState();

    // Application live cycle starts HERE!
    // when first LOCATION_CHANGE is called router does not have "location" set yet
    if (action.type === LOCATION_CHANGE && !prevState.router.location) {
        // initialize wallet
        api.dispatch(WalletActions.init());
        // set initial url
        // TODO: validate if initial url is potentially correct
        api.dispatch({
            type: WALLET.SET_INITIAL_URL,
            pathname: action.payload.pathname,
            state: {},
        });
        // pass action and break process
        return next(action);
    }

    // pass action
    next(action);

    switch (action.type) {
        case WALLET.SET_INITIAL_URL:
            api.dispatch(LocalStorageActions.loadData());
            break;
        case WALLET.SET_SELECTED_DEVICE:
            if (action.device) {
                // try to authorize device
                api.dispatch(TrezorConnectActions.getSelectedDeviceState());
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
    // Corner case: LOCATION_CHANGE was called but pathname didn't changed (redirection from RouterService)
    const prevLocation = prevState.router.location;
    const currentLocation = api.getState().router.location;
    if (action.type === LOCATION_CHANGE && prevLocation.pathname !== currentLocation.pathname) {
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
        if (prevLocation.state.network !== currentLocation.state.network || prevLocation.state.account !== currentLocation.state.account) {
            api.dispatch(SelectedAccountActions.dispose());
        }

        // clear notifications
        api.dispatch(NotificationActions.clear(prevLocation.state, currentLocation.state));
    }

    // observe common values in WallerReducer
    if (!await api.dispatch(WalletActions.observe(prevState, action))) {
        // if "selectedDevice" didn't change observe common values in SelectedAccountReducer
        if (!await api.dispatch(SelectedAccountActions.observe(prevState, action))) {
            // if "selectedAccount" didn't change observe send form props changes
            api.dispatch(SendFormActionActions.observe(prevState, action));
        }
    }

    return action;
};

export default WalletService;