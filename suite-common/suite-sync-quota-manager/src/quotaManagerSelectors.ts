import { type DeviceRootState, selectDeviceId } from '@suite-common/device';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { WalletDescriptor } from '@suite-common/wallet-types';

import { SuiteSyncQuotaManagerState } from './quotaManagerReducer';

export type WithSuiteSyncQuotaManagerState = {
    suiteSyncQuotaManager: SuiteSyncQuotaManagerState;
};

const createMemoizedSelector = createWeakMapSelector.withTypes<
    DeviceRootState & WithSuiteSyncQuotaManagerState
>();

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
    state.suiteSyncQuotaManager.registeredDevices.find(d => d.deviceId === deviceId)
        ?.unspentStorageSize;

export const selectDeviceDismissedNoQuotaLeftWarning = (
    state: WithSuiteSyncQuotaManagerState,
    deviceId: string,
) =>
    state.suiteSyncQuotaManager.registeredDevices.find(d => d.deviceId === deviceId)
        ?.dismissedNoQuotaLeftWarning;

export const selectEnforceQuotaManager = (state: WithSuiteSyncQuotaManagerState) =>
    state.suiteSyncQuotaManager.enforceQuotaManager;

export const selectHasDeviceAllowance = (
    state: WithSuiteSyncQuotaManagerState,
    deviceId: string,
    walletDescriptor: WalletDescriptor,
) => selectIsDeviceRegistered(state, deviceId) && selectHasOwnerAllowance(state, walletDescriptor);

export const selectShouldDisplayOutOfQuotaAlert = createMemoizedSelector(
    [
        (state: WithSuiteSyncQuotaManagerState & DeviceRootState) =>
            selectLeftDeviceQuota(state, selectDeviceId(state) ?? ''),
        (state: WithSuiteSyncQuotaManagerState & DeviceRootState) =>
            selectDeviceDismissedNoQuotaLeftWarning(state, selectDeviceId(state) ?? ''),
    ],
    (quotaLeft, alreadyDismissed) => quotaLeft === 0 && !alreadyDismissed,
);
