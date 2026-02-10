import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';

export type WithSuiteSyncQuotaManagerState = {
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

export const selectRegisteredDevices = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.registeredDevices;

export const selectOwnersAllowance = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.ownersAllowance;

export const selectLeftDeviceQuota = (state: WithSuiteSyncQuotaManagerState, deviceId: string) =>
    state.suiteSyncQuotaManager.registeredDevices.find(di => di.deviceId === deviceId)
        ?.unspentStorageSize;

export const selectDeviceDismissedNoQuotaLeftWarning = (
    state: WithSuiteSyncQuotaManagerState,
    deviceId: string,
) =>
    state.suiteSyncQuotaManager.registeredDevices.find(di => di.deviceId === deviceId)
        ?.dismissedNoQuotaLeftWarning;

export const selectHasDeviceAllowance = (
    state: WithSuiteSyncQuotaManagerState,
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => selectIsDeviceRegistered(state, deviceId) && selectHasOwnerAllowance(state, walletDescriptor);
