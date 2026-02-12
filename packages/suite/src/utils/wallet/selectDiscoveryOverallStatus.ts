import { selectSelectedDevice } from '@suite-common/device';
import { TrezorDevice } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    selectAccountsByDeviceState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { Account, DiscoveryStatus } from '@suite-common/wallet-types';

import { AppState } from 'src/types/suite';

import { DiscoveryStatusType } from '../../types/wallet';

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: DiscoveryStatus | undefined;
    accounts: Account[] | undefined;
    walletSettings: {
        enabledNetworks: NetworkSymbol[];
    };
};

const getDiscoveryStatus = ({
    device,
    discovery,
    accounts,
    walletSettings,
}: GetDiscoveryStatusParams): DiscoveryStatusType | undefined => {
    if (!device) {
        return {
            status: 'loading',
            type: 'waiting-for-device',
        };
    }

    if (walletSettings.enabledNetworks.length === 0) {
        return {
            status: 'exception',
            type: 'discovery-empty',
        };
    }

    if (
        discovery?.status === 'failed' &&
        discovery?.errorCode === 'Device_InvalidState' &&
        !device.available
    ) {
        return {
            status: 'exception',
            type: 'device-unavailable',
        };
    }

    if (
        (discovery?.status === 'failed' && discovery.error) ||
        (accounts ?? []).find(a => a.failed)
    ) {
        return {
            status: 'exception',
            type: 'discovery-failed',
        };
    }

    // if we failed to input pin or passphrase we don't have authorized device.
    if (!device.state?.staticSessionId) {
        return {
            status: 'loading',
            type: 'auth',
        };
    }

    if (discovery?.status === 'progress') {
        return {
            status: 'loading',
            type: 'discovery',
        };
    }

    return undefined;
};

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = (state: AppState) => {
    const device = selectSelectedDevice(state);
    const accounts = device?.state && selectAccountsByDeviceState(state, device.state);
    const discovery = selectDiscoveryByDevicePath(state, device?.path);
    const walletSettings = state.wallet.settings;

    return getDiscoveryStatus({ device, discovery, accounts, walletSettings });
};
