import { useCallback } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from '@suite-common/wallet-core';

export const useDiscovery = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device?.path));

    const calculateProgress = useCallback(() => {
        if (discovery?.status === 'starting') {
            return 1;
        }

        if (discovery?.status === 'progress') {
            return discovery.progress;
        }

        return 0;
    }, [discovery]);

    return {
        device,
        discovery,
        isDiscoveryRunning: isDiscoveryInProgress(discovery),
        calculateProgress,
    };
};
