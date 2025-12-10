import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';

type WithSuiteSyncQuotaManagerState = {
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
};

export const selectQuotaManagerBaseUrl = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.baseUrl;

export const selectIsDeviceRegistered = (state: WithSuiteSyncQuotaManagerState, deviceId: string) =>
    state.suiteSyncQuotaManager.registeredDevices.find(device => device.deviceId === deviceId) !==
    undefined;

export const selectRegisteredDevices = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.registeredDevices;

export const selectAssignedOwnerIds = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.ownersAllowance;

export const selectIsQuotaManagerEnabled = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.enabled;
