import { createReducer } from '@reduxjs/toolkit';

import {
    eraseFetchedDataDebug,
    quotaManagerDeviceFetched,
    quotaManagerDeviceUnspentStorageFetched,
    quotaManagerEnabledUpdated,
    quotaManagerOwnerFetched,
    updateQuotaManagerBaseUrl,
} from './quotaManagerActions';
import { type OwnerAllowance, type RegisteredDevice } from './types';

export type SuiteSyncQuotaManagerState = {
    enabled: boolean; // user can enable/disable Quota Manager in settings and quota manager is disabled automatically when relay URL is not Trezor ones
    baseUrl: string | null;

    registeredDevices: RegisteredDevice[];
    ownersAllowance: OwnerAllowance[];
};

export const quotaManagerInitialState: SuiteSyncQuotaManagerState = {
    enabled: true,
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

                // we clear the fetched data when the base URL changes
                state.registeredDevices = [];
                state.ownersAllowance = [];
            })
            .addCase(eraseFetchedDataDebug, state => {
                state.registeredDevices = [];
                state.ownersAllowance = [];
            })
            .addCase(quotaManagerEnabledUpdated, (state, { payload }) => {
                state.enabled = payload.isEnabled;

                // we clear the data when the QM is disabled
                if (payload.isEnabled === false) {
                    state.registeredDevices = [];
                    state.ownersAllowance = [];
                }
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
            }),
);
