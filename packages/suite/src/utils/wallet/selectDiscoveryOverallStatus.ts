import { TrezorDevice } from '@suite-common/suite-types';
import {
    selectDeviceAccounts,
    selectDiscoveryByDevicePath,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Account, DiscoveryStatus } from '@suite-common/wallet-types';

import { AppState } from 'src/types/suite';

import { DiscoveryStatusType } from '../../types/wallet';
import { NetworkSymbol } from '@suite-common/wallet-config';

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: DiscoveryStatus | undefined;
    accounts: Account[];
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
    if (!device)
        return {
            status: 'loading',
            type: 'waiting-for-device',
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

        if (walletSettings.enabledNetworks.length === 0)
            return {
                status: 'exception',
                type: 'discovery-empty',
            };

        if (
            discovery.status === 'failed' &&
            discovery.errorCode === 'Device_InvalidState' &&
            !device.available
        )
            return {
                status: 'exception',
                type: 'device-unavailable',
            };

        if (
            (discovery.status === 'failed' && discovery.error) ||
            (discovery.failed ?? []).length > 0
        )
            return {
                status: 'exception',
                type: 'discovery-failed',
            };
    }

    return undefined;
};

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = (state: AppState) => {
    const device = selectSelectedDevice(state);
    const discovery = selectDiscoveryByDevicePath(state, device?.path);
    const accounts = selectDeviceAccounts(state);
    const walletSettings = state.wallet.settings;

    return getDiscoveryStatus({ device, discovery, accounts, walletSettings });
};
