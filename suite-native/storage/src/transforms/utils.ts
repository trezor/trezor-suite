import { A, D, O } from '@mobily/ts-belt';

import { DeviceRootState } from '@suite-common/wallet-core';

export const selectDeviceStatesNotRemembered = (state: DeviceRootState) => {
    return A.filterMap(state.device.devices, device =>
        device.remember || !device.state ? O.None : O.Some(device.state),
    );
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
