import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';

import { type DiscoveryRootState } from './discoveryReducer';

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DiscoveryRootState & DeviceRootState
>();

const selectDiscoveries = (state: DiscoveryRootState) => state.wallet.discovery;

export const selectDiscoveryByDevicePath = (state: DiscoveryRootState, path?: DeviceUniquePath) =>
    path !== undefined ? state.wallet.discovery[path] : undefined;

export const selectDiscoveryForSelectedDevice = createMemoizedSelector(
    [selectDiscoveries, selectSelectedDevice],
    (discoveries, selectedDevice) =>
        selectedDevice?.path !== undefined ? discoveries[selectedDevice.path] : undefined,
);

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

export const selectHasRunningDiscovery = createMemoizedSelector(
    [selectDiscoveryForSelectedDevice],
    discovery => isDiscoveryInProgress(discovery),
);

/**
 * Helper selector called from components
 */
export const selectIsDiscoveryStatusConfirmEmptyPassphrase = (
    state: DiscoveryRootState & DeviceRootState,
    path?: DeviceUniquePath,
) => selectDiscoveryByDevicePath(state, path)?.status === 'confirm-empty-passphrase';

export const selectIsCreatingNewPassphraseWallet = createMemoizedSelector(
    [selectDiscoveryForSelectedDevice],
    discovery => discovery?.isAddingHiddenWallet,
);
