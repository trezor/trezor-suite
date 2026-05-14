import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';

import { type DiscoveryRootState } from './discoveryReducer';

export const selectDiscoveryByDevicePath = (state: DiscoveryRootState, path?: DeviceUniquePath) =>
    path !== undefined ? state.wallet.discovery[path] : undefined;

export const selectDiscoveryForSelectedDevice = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);

    return selectDiscoveryByDevicePath(state, selectedDevice?.path);
};

export function isDiscoveryInProgress(
    discovery?: DiscoveryStatus,
): discovery is Exclude<
    DiscoveryStatus,
    { status: 'complete' } | { status: 'failed' } | { status: 'cancelled' }
> {
    if (!discovery) {
        return false;
    }

    return (
        discovery.status !== 'complete' &&
        discovery.status !== 'failed' &&
        discovery.status !== 'cancelled'
    );
}

export const selectHasRunningDiscovery = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryForSelectedDevice(state);

    return isDiscoveryInProgress(discovery);
};

/**
 * Helper selector called from components
 */
export const selectIsDiscoveryStatusConfirmEmptyPassphrase = (
    state: DiscoveryRootState & DeviceRootState,
    path?: DeviceUniquePath,
) => selectDiscoveryByDevicePath(state, path)?.status === 'confirm-empty-passphrase';

export const selectIsCreatingNewPassphraseWallet = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryForSelectedDevice(state);

    return discovery?.isAddingHiddenWallet;
};
