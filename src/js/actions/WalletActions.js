/* @flow */
'use strict';

import { LOCATION_CHANGE } from 'react-router-redux';
import * as WALLET from './constants/wallet';
import * as stateUtils from '../reducers/utils';

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
    State
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
}

export const init = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const updateOnlineStatus = (event) => {
            dispatch({
                type: WALLET.ONLINE_STATUS,
                online: navigator.onLine
            })
        }
        window.addEventListener('online',  updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
    }
}

export const onBeforeUnload = (): WalletAction => {
    return {
        type: WALLET.ON_BEFORE_UNLOAD
    }
}

export const toggleDeviceDropdown = (opened: boolean): WalletAction => {
    return {
        type: WALLET.TOGGLE_DEVICE_DROPDOWN,
        opened
    }
}

export const updateSelectedValues = (prevState: State, action: Action): AsyncAction => {
    return async (dispatch: Dispatch, getState: GetState): Promise<void> => {

        const locationChange: boolean = action.type === LOCATION_CHANGE;
        const state: State = getState();

        // handle devices state change (from trezor-connect events or location change)
        if (locationChange || prevState.devices !== state.devices) {
            const device = stateUtils.getSelectedDevice(state);
            if (state.wallet.selectedDevice !== device) {
                if (device && stateUtils.isSelectedDevice(state.wallet.selectedDevice, device)) {
                    dispatch({
                        type: WALLET.UPDATE_SELECTED_DEVICE,
                        device
                    });
                } else {
                    dispatch({
                        type: WALLET.SET_SELECTED_DEVICE,
                        device
                    });
                }
            }
        }

    }
}