import { TrezorDevice } from '@suite-common/suite-types';
import { selectDiscoveryByDevicePath, selectSelectedDevice } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';

import { AppState } from 'src/types/suite';

import { DiscoveryStatusType } from '../../types/wallet';

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: DiscoveryStatus | undefined;
};

const getDiscoveryStatus = ({
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
    if (!device.state) {
        return {
            status: 'loading',
            type: 'auth',
        };
    }

    if (discovery) {
        if (discovery.status === 'progress' && discovery.isAddingHiddenWallet)
            return {
                status: 'loading',
                // type: discovery.authConfirm ? 'auth-confirm' : 'discovery',
                // type: 'discovery',
                type: 'auth-confirm',
            };

        if (discovery.status === 'confirm-empty-passphrase')
            return {
                status: 'loading',
                type: 'auth-confirm',
            };

        // if (discovery.networks.length === 0)
        //     return {
        //         status: 'exception',
        //         type: 'discovery-empty',
        //     };

        // if (discovery.errorCode === 'Device_InvalidState' && !device.available)
        //     return {
        //         status: 'exception',
        //         type: 'device-unavailable',
        //     };

        // if (discovery.error || discovery.failed.length > 0)
        //     return {
        //         status: 'exception',
        //         type: 'discovery-failed',
        //     };
    }

    return undefined;
};

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = (state: AppState) => {
    const device = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, device?.path);

    return getDiscoveryStatus({ device, discovery });
};
