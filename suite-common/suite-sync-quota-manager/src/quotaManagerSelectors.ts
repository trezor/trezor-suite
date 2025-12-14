import { SuiteSyncOwnerId } from '@suite-common/suite-types';

import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';
import { hashSuiteSyncOwnerId } from './util/hasSuiteSyncOwnerId';

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
    ownerId: SuiteSyncOwnerId,
) => {
    const ownerIdHash = hashSuiteSyncOwnerId(ownerId);

    return (
        state.suiteSyncQuotaManager.assignedOwnerIds.find(
            owner => owner.ownerIdHash === ownerIdHash,
        ) !== undefined
    );
};

export const selectRegisteredDevices = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.registeredDevices;

export const selectAssignedOwnerIds = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.ownersAllowance;

export const selectIsQuotaManagerEnabled = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.enabled;
