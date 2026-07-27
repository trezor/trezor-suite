import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceOrUiLocked } from '@suite/locks';
import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';

type Result = {
    device?: TrezorDevice;
    isLocked: (ignoreDisconnectedDevice?: boolean) => boolean;
};

export const useDevice = (): Result => {
    const device = useSelector(selectSelectedDevice);
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
