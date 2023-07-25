import { useCallback } from 'react';
import { useSelector } from './useSelector';
import { SUITE } from 'src/actions/suite/constants';

export const useDevice = () => {
    const device = useSelector(state => state.suite.device);
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
