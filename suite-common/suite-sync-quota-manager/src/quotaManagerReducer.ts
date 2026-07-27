import { createReducer } from '@reduxjs/toolkit';

import {
    enforceQuotaManagerUpdated,
    eraseFetchedData,
    noQuotaLeftWarningDismissed,
    quotaManagerDeviceFetched,
    quotaManagerDeviceUnspentStorageFetched,
    quotaManagerOwnerFetched,
    updateQuotaManagerBaseUrl,
} from './quotaManagerActions';
import { type OwnerAllowance, type RegisteredDevice } from './types';

export type SuiteSyncQuotaManagerState = {
    baseUrl: string | null;
    enforceQuotaManager: boolean;

    registeredDevices: RegisteredDevice[];
    ownersAllowance: OwnerAllowance[];
};

export const quotaManagerInitialState: SuiteSyncQuotaManagerState = {
    baseUrl: null,
    enforceQuotaManager: false,
    registeredDevices: [],
    ownersAllowance: [],
};

export const suiteSyncQuotaManagerReducer = createReducer<SuiteSyncQuotaManagerState>(
    quotaManagerInitialState,
    builder =>
        builder
            .addCase(updateQuotaManagerBaseUrl, (state, { payload }) => {
                state.baseUrl = payload.baseUrl;

                // we clear the fetched data when the base URL changes
                state.registeredDevices = [];
                state.ownersAllowance = [];
            })
            .addCase(eraseFetchedData, state => {
                state.registeredDevices = [];
                state.ownersAllowance = [];
            })
            .addCase(quotaManagerDeviceFetched, (state, { payload }) => {
                const existingDevice = state.registeredDevices.find(
                    device => device.deviceId === payload.deviceId,
                );
                if (existingDevice) {
                    existingDevice.deviceId = payload.deviceId;
                    existingDevice.totalStorageSize = payload.totalStorageSize;
                    existingDevice.unspentStorageSize = payload.unspentStorageSize;
                } else {
                    state.registeredDevices.push({
                        deviceId: payload.deviceId,
                        totalStorageSize: payload.totalStorageSize,
                        unspentStorageSize: payload.unspentStorageSize,
                        dismissedNoQuotaLeftWarning: false,
                    });
                }
            })
            .addCase(quotaManagerDeviceUnspentStorageFetched, (state, { payload }) => {
                const existingDevice = state.registeredDevices.find(
                    device => device.deviceId === payload.deviceId,
                );
                if (existingDevice) {
                    existingDevice.unspentStorageSize = payload.unspentStorageSize;
                }
            })
            .addCase(quotaManagerOwnerFetched, (state, { payload }) => {
                const existingOwner = state.ownersAllowance.find(
                    owner => owner.walletDescriptor === payload.walletDescriptor,
                );
                if (existingOwner) {
                    existingOwner.totalSpace = payload.totalSpace;
                } else {
                    state.ownersAllowance.push({
                        walletDescriptor: payload.walletDescriptor,
                        totalSpace: payload.totalSpace,
                    });
                }
            })
            .addCase(noQuotaLeftWarningDismissed, (state, { payload }) => {
                const existingDevice = state.registeredDevices.find(
                    device => device.deviceId === payload.deviceId,
                );

                if (existingDevice) {
                    existingDevice.dismissedNoQuotaLeftWarning = true;
                }
            })
            .addCase(enforceQuotaManagerUpdated, (state, { payload }) => {
                state.enforceQuotaManager = payload.enforce;
            }),
);
