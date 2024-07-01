import { A, D, O } from '@mobily/ts-belt';

import { DeviceRootState } from '@suite-common/wallet-core';

export const selectDeviceStatesNotRemembered = (state: DeviceRootState) => {
    return A.filterMap(state.device.devices, device =>
        device.remember || !device.state ? O.None : O.Some(device.state),
    );
};

export const filterKeysByPartialMatch = <O extends Record<string, unknown>>(
    obj: O,
    filterKeys: readonly string[],
): O =>
    D.filterWithKey(
        obj,
        (key, _) => !filterKeys.some(filterKey => key.toString().includes(filterKey)),
    ) as O;
