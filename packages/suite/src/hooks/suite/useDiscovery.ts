import { useCallback } from 'react';
import { useSelector } from './useSelector';
import { DISCOVERY } from '@wallet-actions/constants';
import { DiscoveryStatus } from '@wallet-types';

export const useDiscovery = () => {
    const { device, discoveryState } = useSelector(state => ({
        device: state.suite.device,
        discoveryState: state.wallet.discovery,
    }));
    const discovery = discoveryState.find(d => d.deviceState === device?.state);

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.loaded && discovery.total) {
            return Math.round((discovery.loaded / discovery.total) * 100);
        }
        return 0;
    }, [discovery]);

    const getStatus = useCallback((): DiscoveryStatus | undefined => {
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
            if (discovery.status < DISCOVERY.STATUS.STOPPING)
                return {
                    status: 'loading',
                    type: discovery.authConfirm ? 'auth-confirm' : 'discovery',
                };

            if (discovery.status === DISCOVERY.STATUS.COMPLETED && discovery.authConfirm)
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
        isDiscoveryRunning: discovery && discovery.status < DISCOVERY.STATUS.STOPPING,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
