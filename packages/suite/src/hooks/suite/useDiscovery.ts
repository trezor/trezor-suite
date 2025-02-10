import { useCallback } from 'react';

import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { selectDiscoveryByDeviceState, selectSelectedDevice } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';
import { getDiscoveryStatus } from '../../utils/wallet/getDiscoveryStatus';

export const useDiscovery = () => {
    const device = useSelector(selectSelectedDevice);
    const discovery = useSelector(state => selectDiscoveryByDeviceState(state, device?.state));

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.loaded && discovery.total) {
            return Math.round((discovery.loaded / discovery.total) * 100);
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
        isDiscoveryRunning: discovery && discovery.status < DiscoveryStatus.STOPPING,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
