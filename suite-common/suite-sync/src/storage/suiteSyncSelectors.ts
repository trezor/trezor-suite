import { DeviceRootState } from '@suite-common/wallet-core';

import { SuiteSyncState } from './suiteSyncReducer';

export type WithSuiteSyncState = {
    suiteSync: SuiteSyncState;
};

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

export const selectIsLocalFirstStorageEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isLocalFirstStorageEnabled;

export const selectIsLocalFirstStorageDebugEnabled = (
    state: WithSuiteSyncAndDeviceState,
): boolean => state.suiteSync.settings.isLocalFirstStorageDebugEnabled;

export const selectIsFeatureLocalFirstStorageAvailable = (
    state: WithSuiteSyncAndDeviceState,
): boolean => state.suiteSync.settings.isFeatureLocalFirstStorageAvailable;

export const selectLocalFirstStorageRelayUrl = (state: WithSuiteSyncAndDeviceState) =>
    state.suiteSync.settings.localFirstStorageRelayUrl;

export const selectShouldOfferSecureSync = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.device.selectedDevice?.unavailableCapabilities?.evolu === undefined &&
    state.suiteSync.settings.isFeatureLocalFirstStorageAvailable &&
    !state.suiteSync.settings.isLocalFirstStorageEnabled;
