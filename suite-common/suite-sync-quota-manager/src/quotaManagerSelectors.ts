import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';

type WithSuiteSyncQuotaManagerState = {
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
};

export const selectQuotaManagerBaseUrl = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.baseUrl;

export const selectIsDeviceRegistered = (state: WithSuiteSyncQuotaManagerState, deviceId: string) =>
    state.suiteSyncQuotaManager.registeredDevices.find(device => device.deviceId === deviceId) !==
    undefined;

export const selectHasOwnerAllowance = (
    state: WithSuiteSyncQuotaManagerState,
    walletDescriptor: WalletDescriptor,
) =>
    state.suiteSyncQuotaManager.ownersAllowance.find(
        owner => owner.walletDescriptor === walletDescriptor,
    ) !== undefined;

// If device has an owner, is registered in quota manager and the owner
// already has an allowance, there's nothing to refresh — return success.
export const selectHasDeviceAllowance = (
    state: WithSuiteSyncQuotaManagerState,
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => selectIsDeviceRegistered(state, deviceId) && selectHasOwnerAllowance(state, walletDescriptor);

export const selectRegisteredDevices = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.registeredDevices;

export const selectOwnersAllowance = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.ownersAllowance;

export const selectIsQuotaManagerEnabled = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.enabled;
