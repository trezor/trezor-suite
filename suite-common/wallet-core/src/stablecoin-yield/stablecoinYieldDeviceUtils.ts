import type { TrezorDevice } from '@suite-common/suite-types';
import { DeviceModelInternal, getFirmwareVersionArray } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';

import type { YieldFlowType } from './stablecoinYieldTypes';

export const isStablecoinYieldSupported = (
    device: TrezorDevice | undefined,
    flowType?: YieldFlowType,
): boolean => {
    if (device?.features?.internal_model === DeviceModelInternal.T1B1) {
        return true;
    }

    const firmware = getFirmwareVersionArray(device);

    if (firmware === null) {
        return false;
    }

    if (flowType === 'claim') {
        return versionUtils.isNewerOrEqual(firmware, [2, 12, 1]);
    }

    return versionUtils.isNewerOrEqual(firmware, [2, 12, 0]);
};
