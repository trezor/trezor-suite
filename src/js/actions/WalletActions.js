/* @flow */
'use strict';

import * as WALLET from './constants/wallet';

import type { RouterLocationState } from '../flowtype';

export type WalletAction = {
    type: typeof WALLET.SET_INITIAL_URL,
    state?: RouterLocationState,
    pathname?: string
} | {
    type: typeof WALLET.TOGGLE_DEVICE_DROPDOWN,
    opened: boolean
} | {
    type: typeof WALLET.ON_BEFORE_UNLOAD
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
