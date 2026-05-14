import type { DeviceRootState } from '@suite-common/device';
import {
    type DiscoveryRootState,
    selectDiscoveryByDevicePath,
    selectIsCreatingNewPassphraseWallet,
} from '@suite-common/wallet-core';

/**
 * Returns true if discovery failed due to passphrase flow (cancelled, wrong passphrase, modal dismissed).
 */
export const isPassphraseDiscoveryFailure = (
    status: { status: string; error?: string; errorCode?: string } | undefined,
): boolean => {
    if (!status) return false;

    if (status.status === 'cancelled' || status.status === 'passphrase-mismatch') {
        return true;
    }

    if (
        status.status === 'failed' &&
        (status.errorCode === 'Method_Interrupted' || status.error === 'Passphrase is incorrect')
    ) {
        return true;
    }

    return false;
};

export const selectHasPassphraseMismatchError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'passphrase-mismatch';
};

export const selectHasPassphraseIncorrectError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'failed' && discovery?.error === 'Passphrase is incorrect';
};

export { selectIsCreatingNewPassphraseWallet };

export const selectPassphraseDeviceNotEmpty = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    switch (discovery.status) {
        case 'confirm-empty-passphrase':
            return false;
        case 'complete':
            return true;
        default:
            return null;
    }
};

export const selectPassphraseDiscoveryCompleted = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    if (!discovery || !discovery.isAddingHiddenWallet) {
        return null;
    }

    return (
        discovery.status === 'complete' ||
        (discovery.status === 'progress' && discovery.hasLoadedAnyNonEmptyAccount)
    );
};

export const selectHasPassphraseError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return (
        discovery?.isAddingExistingWallet &&
        ['failed', 'cancelled', 'passphrase-mismatch'].includes(discovery.status)
    );
};

export const selectHasVerificationCancelledError = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'cancelled';
};
