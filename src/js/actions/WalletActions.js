/* @flow */


import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from './constants/wallet';
import * as CONNECT from './constants/TrezorConnect';
import * as stateUtils from '../reducers/utils';

import type { Device } from 'trezor-connect';
import type
{
    Account,
    Coin,
    Discovery,
    Token,
    Web3Instance,
    TrezorDevice,
    RouterLocationState,
    ThunkAction,
    AsyncAction,
    Action,
    Dispatch,
    GetState,
    State,
} from '~/flowtype';

export type WalletAction = {
    type: typeof WALLET.SET_INITIAL_URL,
    state?: RouterLocationState,
    pathname?: string
} | {
    type: typeof WALLET.TOGGLE_DEVICE_DROPDOWN,
    opened: boolean
} | {
    type: typeof WALLET.ON_BEFORE_UNLOAD
} | {
    type: typeof WALLET.ONLINE_STATUS,
    online: boolean
} | {
    type: typeof WALLET.SET_SELECTED_DEVICE,
    device: ?TrezorDevice
} | {
    type: typeof WALLET.UPDATE_SELECTED_DEVICE,
    device: TrezorDevice
} | {
    type: typeof WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA,
    devices: Array<TrezorDevice>
}

export const init = (): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    const updateOnlineStatus = (event) => {
        dispatch({
            type: WALLET.ONLINE_STATUS,
            online: navigator.onLine,
        });
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
};

export const onBeforeUnload = (): WalletAction => ({
    type: WALLET.ON_BEFORE_UNLOAD,
});

export const toggleDeviceDropdown = (opened: boolean): WalletAction => ({
    type: WALLET.TOGGLE_DEVICE_DROPDOWN,
    opened,
});

// This method will be called after each DEVICE.CONNECT action
// if connected device has different "passphrase_protection" settings than saved instances
// all saved instances will be removed immediately inside DevicesReducer
// This method will clear leftovers associated with removed instances from reducers.
// (DiscoveryReducer, AccountReducer, TokensReducer)
export const clearUnavailableDevicesData = (prevState: State, device: Device): ThunkAction => (dispatch: Dispatch, getState: GetState): void => {
    if (!device.features) return;

    const affectedDevices = prevState.devices.filter(d => d.features
            && d.features.device_id === device.features.device_id
            && d.features.passphrase_protection !== device.features.passphrase_protection);

    if (affectedDevices.length > 0) {
        dispatch({
            type: WALLET.CLEAR_UNAVAILABLE_DEVICE_DATA,
            devices: affectedDevices,
        });
    }
};


export const updateSelectedValues = (prevState: State, action: Action): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const locationChange: boolean = action.type === LOCATION_CHANGE;
    const state: State = getState();

    // handle devices state change (from trezor-connect events or location change)
    if (locationChange || prevState.devices !== state.devices) {
        const device = stateUtils.getSelectedDevice(state);
        if (state.wallet.selectedDevice !== device) {
            if (device && stateUtils.isSelectedDevice(state.wallet.selectedDevice, device)) {
                dispatch({
                    type: WALLET.UPDATE_SELECTED_DEVICE,
                    device,
                });
            } else {
                dispatch({
                    type: WALLET.SET_SELECTED_DEVICE,
                    device,
                });
            }
        }
    }
};