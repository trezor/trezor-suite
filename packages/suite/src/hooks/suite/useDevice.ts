import { useCallback } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

import { selectIsDeviceOrUiLocked } from 'src/reducers/suite/suiteReducer';

import { useSelector } from './useSelector';
import { TrezorDevice } from '@suite-common/suite-types';

type Result = {
    device?: TrezorDevice;
    isLocked: (ignoreDisconnectedDevice?: boolean) => boolean;
};

export const useDevice = (): Result => {
    const device = useSelector(selectDevice);
    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);

    const isLocked = useCallback(
        (ignoreDisconnectedDevice = false) => {
            if (!device?.connected && !ignoreDisconnectedDevice) return true;
            if (isDeviceOrUiLocked) return true;

            return false;
        },
        [device, isDeviceOrUiLocked],
    );

    return {
        device,
        isLocked,
    };
};
