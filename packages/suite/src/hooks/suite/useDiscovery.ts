import { useCallback } from 'react';

import { selectDiscoveryByDeviceState, selectDevice } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import { DiscoveryStatusType } from 'src/types/wallet';

import { useSelector } from './useSelector';

export const useDiscovery = () => {
    const device = useSelector(selectDevice);
    const discovery = useSelector(state => selectDiscoveryByDeviceState(state, device?.state));

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.loaded && discovery.total) {
            return Math.round((discovery.loaded / discovery.total) * 100);
        }

        return 0;
    }, [discovery]);

    const getStatus = useCallback((): DiscoveryStatusType | undefined => {
        if (!device)
            return {
                status: 'loading',
                type: 'waiting-for-device',
            };
        if (device.authFailed)
            return {
                status: 'exception',
                type: 'auth-failed',
            };
        if (device.authConfirm)
            return {
                status: 'exception',
                type: 'auth-confirm-failed',
            };
        if (!device.state)
            return {
                status: 'loading',
                type: 'auth',
            };

        if (discovery) {
            if (discovery.status < DiscoveryStatus.STOPPING)
                return {
                    status: 'loading',
                    type: discovery.authConfirm ? 'auth-confirm' : 'discovery',
                };

            if (discovery.status === DiscoveryStatus.COMPLETED && discovery.authConfirm)
                return {
                    status: 'loading',
                    type: 'auth-confirm',
                };

            if (discovery.networks.length === 0)
                return {
                    status: 'exception',
                    type: 'discovery-empty',
                };

            if (discovery.errorCode === 'Device_InvalidState' && !device.available)
                return {
                    status: 'exception',
                    type: 'device-unavailable',
                };

            if (discovery.error || discovery.failed.length > 0)
                return {
                    status: 'exception',
                    type: 'discovery-failed',
                };
        }

        return undefined;
    }, [device, discovery]);

    return {
        device,
        discovery,
        isDiscoveryRunning: discovery && discovery.status < DiscoveryStatus.STOPPING,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
