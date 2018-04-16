/* @flow */
'use strict';

import type { TrezorDevice } from '../flowtype';

export const getAccounts = (accounts: Array<any>, device: any, network: ?string): Array<any> => {
    if (network) {
        return accounts.filter((addr) => addr.deviceState === device.state && addr.network === network);
    } else {
        return accounts.filter((addr) => addr.deviceState === device.state);
    }
    
}

// Public method used in components to find device by state and device_id
export const findDevice = (devices: Array<TrezorDevice>, state: ?string, deviceId: ?string, instance: ?number): ?TrezorDevice => {
    return devices.find(d => d.state === state && d.features && d.features.device_id === deviceId && d.instance === instance);
}