import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isDiscoveryInProgress,
    selectAccountsByDeviceState,
    selectDeviceSupportedNetworks,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { type Account, type DiscoveryStatus } from '@suite-common/wallet-types';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type AppState } from 'src/types/suite';

import { type DiscoveryStatusType } from '../../types/wallet';

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

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

const selectSelectedDeviceAccounts = (state: AppState): Account[] | undefined => {
    const deviceState = selectSelectedDevice(state)?.state;

    return deviceState && selectAccountsByDeviceState(state, deviceState);
};

const selectSelectedDeviceDiscovery = (state: AppState) =>
    selectDiscoveryByDevicePath(state, selectSelectedDevice(state)?.path);

// TODO move this selector somewhere more sensible
export const selectDiscoveryOverallStatus = createMemoizedSelector(
    [
        selectSelectedDevice,
        selectDeviceSupportedNetworks,
        selectSelectedDeviceAccounts,
        selectSelectedDeviceDiscovery,
        state => state.wallet.settings,
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
