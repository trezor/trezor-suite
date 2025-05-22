import { useCallback } from 'react';

import { selectSelectedDevice } from '@suite-common/device';
import { selectDiscoveryByDeviceState } from '@suite-common/wallet-blockchain';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

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
        isDiscoveryRunning: discovery ? discovery.status < DiscoveryStatus.STOPPING : false,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
