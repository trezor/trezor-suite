import { DeviceRootState } from '@suite-common/wallet-core/src/device/deviceReducer';

import { SuiteSyncState } from './suiteSyncReducer';

export type WithSuiteSyncState = {
    suiteSync: SuiteSyncState;
};

export type WithSuiteSyncAndDeviceState = WithSuiteSyncState & DeviceRootState;

export const selectIsSuiteSyncEnabled = (state: WithSuiteSyncState): boolean =>
    state.suiteSync.settings.isSuiteSyncEnabled;

export const selectIsSuiteSyncDebugEnabled = (state: WithSuiteSyncState): boolean =>
    state.suiteSync.settings.isSuiteSyncDebugEnabled;

export const selectIsFeatureSuiteSyncAvailable = (state: WithSuiteSyncState): boolean =>
    state.suiteSync.settings.isFeatureSuiteSyncAvailable;

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncState) =>
    state.suiteSync.settings.suiteSyncRelayUrl;

export const selectShouldOfferSecureSync = (state: WithSuiteSyncAndDeviceState): boolean =>
    state.device.selectedDevice?.unavailableCapabilities?.evolu === undefined &&
    state.suiteSync.settings.isFeatureSuiteSyncAvailable &&
    !state.suiteSync.settings.isSuiteSyncEnabled;
