import { selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    isDiscoveryInProgress,
    selectAccountsByDeviceState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';
import { type Account, type DiscoveryStatus } from '@suite-common/wallet-types';

import { type AppState } from 'src/types/suite';

import { type DiscoveryStatusType } from '../../types/wallet';

type GetDiscoveryStatusParams = {
    device: TrezorDevice | undefined;
    discovery: DiscoveryStatus | undefined;
    accounts: Account[] | undefined;
    walletSettings: {
        enabledNetworks: NetworkSymbol[];
    };
};

// Singleton results so useSelector consumers stay reference-stable across dispatches.
const WAITING_FOR_DEVICE: DiscoveryStatusType = {
    status: 'loading',
    type: 'waiting-for-device',
};
const DISCOVERY_EMPTY: DiscoveryStatusType = { status: 'exception', type: 'discovery-empty' };
const DEVICE_UNAVAILABLE: DiscoveryStatusType = {
    status: 'exception',
    type: 'device-unavailable',
};
const DISCOVERY_FAILED: DiscoveryStatusType = { status: 'exception', type: 'discovery-failed' };
const AUTH_LOADING: DiscoveryStatusType = { status: 'loading', type: 'auth' };
const DISCOVERY_LOADING: DiscoveryStatusType = { status: 'loading', type: 'discovery' };

const getDiscoveryStatus = ({
    device,
    discovery,
    accounts,
    walletSettings,
}: GetDiscoveryStatusParams): DiscoveryStatusType | undefined => {
    if (!device) return WAITING_FOR_DEVICE;

    if (walletSettings.enabledNetworks.length === 0) return DISCOVERY_EMPTY;

    if (
        discovery?.status === 'failed' &&
        discovery?.errorCode === 'Device_InvalidState' &&
        !device.available
    ) {
        return DEVICE_UNAVAILABLE;
    }

    if (
        (discovery?.status === 'failed' && discovery.error) ||
        (!isDiscoveryInProgress(discovery) && (accounts ?? []).some(a => a.failed))
    ) {
        return DISCOVERY_FAILED;
    }

    // if we failed to input pin or passphrase we don't have authorized device.
    if (!device.state?.staticSessionId) return AUTH_LOADING;

    if (isDiscoveryInProgress(discovery)) return DISCOVERY_LOADING;

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
