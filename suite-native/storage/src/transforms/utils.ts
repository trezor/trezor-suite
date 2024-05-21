import { A, D, O } from '@mobily/ts-belt';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDeviceState,
    PORTFOLIO_TRACKER_DEVICE_ID,
} from '@suite-common/wallet-core';

export const selectDeviceStatesNotRemembered = (state: DeviceRootState & DiscoveryRootState) => {
    return A.filterMap(state.device.devices, device => {
        if (
            !device.state ||
            device.id === PORTFOLIO_TRACKER_DEVICE_ID ||
            (device.remember && !selectDiscoveryByDeviceState(state, device.state))
        ) {
            return O.None;
        }

        return O.Some(device.state);
    });
};

export const filterObjectKeys = <O extends Record<string, any>>(
    obj: O,
    filterKeys: readonly string[],
): O =>
    D.keys(obj).reduce((result, key) => {
        const isKeyFiltered = filterKeys.some(filterKey => key.toString().includes(filterKey));
        if (isKeyFiltered) {
            return result;
        } else {
            return { ...result, [key]: obj[key] };
        }
    }, {} as O);
