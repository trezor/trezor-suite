import { createReducer } from '@reduxjs/toolkit';

import {
    eraseFetchedDataDebug,
    quotaManagerDeviceFetched,
    quotaManagerEnabledUpdated,
    quotaManagerOwnerFetched,
    updateQuotaManagerBaseUrl,
} from './quotaManagerActions';
import { type AssignedOwnerId, type RegisteredDevice } from './types';

export type SuiteSyncQuotaManagerState = {
    enabled: boolean; // user can enable/disable Quota Manager in settings and quota manager is disabled automatically when relay URL is not Trezor ones
    baseUrl: string | null;

    registeredDevices: RegisteredDevice[];
    ownersAllowance: AssignedOwnerId[];
};

export const quotaManagerInitialState: SuiteSyncQuotaManagerState = {
    enabled: false,
    baseUrl: null,
    registeredDevices: [],
    ownersAllowance: [],
};

export const suiteSyncQuotaManagerReducer = createReducer<SuiteSyncQuotaManagerState>(
    quotaManagerInitialState,
    builder =>
        builder
            .addCase(updateQuotaManagerBaseUrl, (state, { payload }) => {
                state.baseUrl = payload.baseUrl;
            })
            .addCase(eraseFetchedDataDebug, state => {
                state.registeredDevices = [];
                state.ownersAllowance = [];
            })
            .addCase(quotaManagerEnabledUpdated, (state, { payload }) => {
                state.enabled = payload.isEnabled;
            })
            .addCase(quotaManagerDeviceFetched, (state, { payload }) => {
                const existingDevice = state.registeredDevices.find(
                    device => device.publicKey === payload.publicKey,
                );
                if (existingDevice) {
                    existingDevice.deviceId = payload.deviceId;
                    existingDevice.totalStorageSize = payload.totalStorageSize;
                    existingDevice.unspentStorageSize = payload.unspentStorageSize;
                } else {
                    state.registeredDevices.push({
                        deviceId: payload.deviceId,
                        publicKey: payload.publicKey,
                        totalStorageSize: payload.totalStorageSize,
                        unspentStorageSize: payload.unspentStorageSize,
                    });
                }
            })
            .addCase(quotaManagerOwnerFetched, (state, { payload }) => {
                const existingOwner = state.assignedOwnerIds.find(
                    owner => owner.ownerIdHash === payload.ownerIdHash,
                );
                if (existingOwner) {
                    existingOwner.totalSpace = payload.totalSpace;
                } else {
                    state.assignedOwnerIds.push({
                        ownerIdHash: payload.ownerIdHash,
                        totalSpace: payload.totalSpace,
                    });
                }
            }),
);
