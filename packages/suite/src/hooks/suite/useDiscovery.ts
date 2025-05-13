import { useCallback } from 'react';

import {
    isDiscoveryInProgress,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';

import { useSelector } from './useSelector';
import { getDiscoveryStatus } from '../../utils/wallet/getDiscoveryStatus';

export const useDiscovery = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device?.path));

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.status === 'starting') {
            return 1;
        }

        if (discovery && discovery.status === 'progress') {
            return discovery.progress;
        }

        return 0;
    }, [discovery]);

    const getStatus = useCallback(
        () => getDiscoveryStatus({ device, discovery }),
        [device, discovery],
    );

    return {
        device,
        discovery,
        isDiscoveryRunning: isDiscoveryInProgress(discovery),
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
