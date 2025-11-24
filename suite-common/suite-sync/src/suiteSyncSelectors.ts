import { DeviceRootState } from '@suite-common/wallet-core';

import { SuiteSyncState } from './suiteSyncReducer';

export type WithSuiteSyncState = {
    suiteSync: SuiteSyncState;
};

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

export const selectIsSuiteSyncEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncEnabled;

export const selectIsSuiteSyncDebugEnabled = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isSuiteSyncDebugEnabled;

export const selectIsFeatureSuiteSyncAvailable = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.suiteSync.settings.isFeatureSuiteSyncAvailable;

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncAndDeviceState) =>
    state.suiteSync.settings.suiteSyncRelayUrl;

export const selectShouldOfferSecureSync = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.device.selectedDevice?.unavailableCapabilities?.evolu === undefined &&
    state.suiteSync.settings.isFeatureSuiteSyncAvailable &&
    !state.suiteSync.settings.isSuiteSyncEnabled;
