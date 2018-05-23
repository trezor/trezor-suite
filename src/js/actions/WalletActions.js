/* @flow */
'use strict';

import * as WALLET from './constants/wallet';

import type { TrezorDevice, RouterLocationState, ThunkAction, Dispatch, GetState } from '~/flowtype';

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
