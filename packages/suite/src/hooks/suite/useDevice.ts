import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { SUITE } from '@suite-actions/constants';
import { AppState } from '@suite-types';

export const useDevice = () => {
    const device = useSelector<AppState, AppState['suite']['device']>(state => state.suite.device);
    const locks = useSelector<AppState, AppState['suite']['locks']>(state => state.suite.locks);

    const isLocked = useCallback(
        (ignoreDisconnectedDevice?: boolean) => {
            if ((!device || !device.connected) && !ignoreDisconnectedDevice) return true;
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
