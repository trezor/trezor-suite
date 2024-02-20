import { useCallback } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

import { SUITE } from 'src/actions/suite/constants';

import { useSelector } from './useSelector';

export const useDevice = () => {
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
