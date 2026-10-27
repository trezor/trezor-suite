import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type DiscoveryRootState,
    type WalletSettingsRootState,
    isDiscoveryInProgress,
    selectAccountsByDeviceState,
    selectDeviceSupportedNetworks,
    selectDiscoveryForSelectedDevice,
    selectWalletSettings,
} from '@suite-common/wallet-core';
import { type Account, type DiscoveryStatus } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type DiscoveryStatusType } from '../../types/wallet';

export type DiscoveryOverallStatusState = NetworksRootState &
    DeviceRootState &
    AccountsRootState &
    DiscoveryRootState &
    WalletSettingsRootState;

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: DiscoveryStatus | undefined;
    accounts: Account[] | undefined;
    deviceSupportedNetworks: NetworkSymbol[];
    walletSettings: {
        enabledNetworks: NetworkSymbol[];
    };
};

const getDiscoveryStatus = ({
    device,
    discovery,
    accounts,
    deviceSupportedNetworks,
    walletSettings,
}: GetDiscoveryStatusParams): DiscoveryStatusType | undefined => {
    if (!device) {
        return {
            status: 'loading',
            type: 'waiting-for-device',
        };
    }

    const hasEnabledSupportedNetwork = walletSettings.enabledNetworks.some(networkSymbol =>
        deviceSupportedNetworks.includes(networkSymbol),
    );

    if (!hasEnabledSupportedNetwork) {
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
        (!isDiscoveryInProgress(discovery) && (accounts ?? []).some(a => a.failed))
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

    if (isDiscoveryInProgress(discovery)) {
        return {
            status: 'loading',
            type: 'discovery',
        };
    }

    return undefined;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<DiscoveryOverallStatusState>();

const selectSelectedDeviceAccounts = (
    state: DiscoveryOverallStatusState,
): Account[] | undefined => {
    const deviceState = selectSelectedDevice(state)?.state;

    return deviceState && selectAccountsByDeviceState(state, deviceState);
};

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = createMemoizedSelector(
    [
        selectSelectedDevice,
        selectDeviceSupportedNetworks,
        selectSelectedDeviceAccounts,
        selectDiscoveryForSelectedDevice,
        selectWalletSettings,
    ],
    (device, deviceSupportedNetworks, accounts, discovery, walletSettings) =>
        getDiscoveryStatus({
            device,
            discovery,
            accounts,
            deviceSupportedNetworks,
            walletSettings,
        }),
);
