import {
    DeviceRootState,
    DiscoveryRootState,
    selectDiscoveryByDevicePath,
} from '@suite-common/wallet-core';

export const selectHasPassphraseMismatchError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'passphrase-mismatch';
};

export const selectHasPassphraseIncorrectError = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.status === 'failed' && discovery?.error === 'Passphrase is incorrect';
};

export const selectIsCreatingNewPassphraseWallet = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDiscoveryByDevicePath(state, state.device.selectedDevice?.path);

    return discovery?.isAddingHiddenWallet;
};

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
