import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DISCOVERY } from '@wallet-actions/constants';
import { AppState } from '@suite-types';
import { Discovery, DiscoveryStatus } from '@wallet-types';

export const useDiscovery = () => {
    const [running, setRunning] = useState(false);
    const [discovery, setDiscovery] = useState<Discovery | undefined>(undefined);

    const device = useSelector<AppState, AppState['suite']['device']>(state => state.suite.device);
    const discoveryState = useSelector<AppState, AppState['wallet']['discovery']>(
        state => state.wallet.discovery,
    );
    const discoveryItem =
        device && device.state
            ? discoveryState.find(d => d.deviceState === device.state)
            : undefined;

    const calculateProgress = useCallback(() => {
        if (discovery && discovery.loaded && discovery.total) {
            return Math.round((discovery.loaded / discovery.total) * 100);
        }
        return 0;
    }, [discovery]);

    const getStatus = useCallback((): DiscoveryStatus | void => {
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
        if (running)
            return {
                status: 'loading',
                type: 'discovery',
            };

        if (discovery) {
            if (discovery.networks.length === 0) {
                return {
                    status: 'exception',
                    type: 'discovery-empty',
                };
            }

            if (discovery.errorCode === 'Device_InvalidState' && !device.available) {
                return {
                    status: 'exception',
                    type: 'device-unavailable',
                };
            }

            if (discovery.error || discovery.failed.length > 0) {
                return {
                    status: 'exception',
                    type: 'discovery-failed',
                };
            }
            if (discovery.error || discovery.failed.length > 0) {
                return {
                    status: 'exception',
                    type: 'discovery-failed',
                };
            }
        }
    }, [device, discovery, running]);

    useEffect(() => {
        setRunning(discoveryItem ? discoveryItem.status < DISCOVERY.STATUS.STOPPING : false);
        setDiscovery(discoveryItem);
    }, [discoveryItem]);

    return {
        device,
        discovery,
        isDiscoveryRunning: running,
        getDiscoveryStatus: getStatus,
        calculateProgress,
    };
};
