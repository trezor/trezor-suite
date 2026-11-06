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

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = (state: DiscoveryOverallStatusState) => {
    const device = selectSelectedDevice(state);
    const deviceSupportedNetworks = selectDeviceSupportedNetworks(state);
    const accounts = device?.state && selectAccountsByDeviceState(state, device.state);
    const discovery = selectDiscoveryForSelectedDevice(state);
    const walletSettings = selectWalletSettings(state);

    return getDiscoveryStatus({
        device,
        discovery,
        accounts,
        deviceSupportedNetworks,
        walletSettings,
    });
};
