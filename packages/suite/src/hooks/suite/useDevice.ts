import { useCallback } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';

import { useSelector } from './useSelector';
import { TrezorDevice } from '@suite-common/suite-types';

type Result = {
    device?: TrezorDevice;
    isLocked: (ignoreDisconnectedDevice?: boolean) => boolean;
};

export const useDevice = (): Result => {
    const device = useSelector(selectDevice);
    const locks = useSelector(state => state.suite.locks);

    const isLocked = useCallback(
        (ignoreDisconnectedDevice = false) => {
            if (!device?.connected && !ignoreDisconnectedDevice) return true;
            if (locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI))
                return true;

            return false;
        },
        [device, locks],
    );

    return {
        device,
        isLocked,
    };
};
