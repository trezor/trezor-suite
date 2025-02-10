import { TrezorDevice } from '@suite-common/suite-types';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import { Discovery, DiscoveryStatusType } from '../../types/wallet';

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: Discovery | undefined;
};

export const getDiscoveryStatus = ({
    device,
    discovery,
}: GetDiscoveryStatusParams): DiscoveryStatusType | undefined => {
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
};
