import { useCallback } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { selectDiscoveryByDeviceState, selectSelectedDevice } from '@suite-common/wallet-core';

import { useSelector } from './useSelector';
import { getDiscoveryStatus } from '../../utils/wallet/getDiscoveryStatus';

export const useDiscovery = ({ device }: { device?: TrezorDevice } = {}) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const discoveryDevice = device ?? selectedDevice;
    const discovery = useSelector(state =>
        selectDiscoveryByDeviceState(state, discoveryDevice?.state),
    );

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.loaded && discovery.total) {
            return Math.round((discovery.loaded / discovery.total) * 100);
        }

        return 0;
    }, [discovery]);

    const getStatus = useCallback(
        () => getDiscoveryStatus({ device: discoveryDevice, discovery }),
        [discoveryDevice, discovery],
    );

    return {
        device: discoveryDevice,
        discovery,
        isDiscoveryRunning: discovery ? discovery.status < DiscoveryStatus.STOPPING : false,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
