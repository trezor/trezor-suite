/* @flow */
'use strict';

export const ON_RESIZE: string = 'ON_RESIZE';
export const TOGGLE_DEVICE_DROPDOWN: string = 'TOGGLE_DEVICE_DROPDOWN';
import * as WALLET from './constants/wallet';

export const onResize = (): any => {
    return {
        type: ON_RESIZE
    }
}

export const onBeforeUnload = (): any => {
    return {
        type: WALLET.ON_BEFORE_UNLOAD
    }
}

export const toggleDeviceDropdown = (opened: boolean): any => {
    return {
        type: WALLET.TOGGLE_DEVICE_DROPDOWN,
        opened
    }
}
