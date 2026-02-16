import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { EncryptedHex } from '@suite-common/platform-encryption';
import {
    SuiteSyncFirmwareUpgradeNeededDeviceErrorType,
    SuiteSyncOwnerSerialized,
} from '@suite-common/suite-sync-types';
import { deviceActions } from '@suite-common/wallet-core';
import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';

export type SuiteSyncErrorType =
    | DeviceErrorType
    | DeviceCancelledErrType
    | SuiteSyncFirmwareUpgradeNeededDeviceErrorType;

export type SuiteSyncSettings = {
    /**
     * This is flag to show some extra Debug UI.
     */
    isSuiteSyncDebugEnabled: boolean;

    /**
     * This flag enables Suite Sync. It is intended as Switch
     * in the settings, so privacy focused users can simply
     * switch whole feature off.
     */
    isSuiteSyncEnabled: boolean;

    /**
     * This is URL for backend/relay.
     *
     * Todo: This is kinda reladed to Evolu, and other libraries
     *       can have different config. So this may better be in some
     *       Provider-Config place in the future.
     */
    suiteSyncRelayUrl: string | null;
};

export type SuiteSyncState = {
    settings: SuiteSyncSettings;
    suiteSyncErrors: Record<StaticSessionId, SuiteSyncErrorType>;
    suiteSyncOwners: Record<StaticSessionId, EncryptedHex<SuiteSyncOwnerSerialized>>;
};

export const initialSuiteSyncState: SuiteSyncState = {
    settings: {
        isSuiteSyncEnabled: false,
        isSuiteSyncDebugEnabled: false,
        suiteSyncRelayUrl: null,
    },
    suiteSyncErrors: {},
    suiteSyncOwners: {},
};

export const suiteSyncSlice = createSlice({
    name: 'suiteSync',
    initialState: initialSuiteSyncState,
    reducers: {
        updateSuiteSyncEnabled: (state, { payload }: PayloadAction<{ isEnabled: boolean }>) => {
            state.settings.isSuiteSyncEnabled = payload.isEnabled;
        },
        updateSuiteSyncDebugEnabled: (
            state,
            { payload }: PayloadAction<{ isEnabled: boolean }>,
        ) => {
            state.settings.isSuiteSyncDebugEnabled = payload.isEnabled;
        },
        setSuiteSyncRelayUrl: (state, { payload }: PayloadAction<{ url: string | null }>) => {
            state.settings.suiteSyncRelayUrl = payload.url;
        },
        setSuiteSyncError: (
            state,
            {
                payload,
            }: PayloadAction<{
                deviceStaticSessionId: StaticSessionId;
                error: SuiteSyncErrorType | null;
            }>,
        ) => {
            if (payload.error === null) {
                delete state.suiteSyncErrors[payload.deviceStaticSessionId];
            } else {
                state.suiteSyncErrors[payload.deviceStaticSessionId] = payload.error;
            }
        },
        setSuiteSyncOwner: (
            state,
            {
                payload,
            }: PayloadAction<{
                deviceStaticId: StaticSessionId;
                owner: EncryptedHex<SuiteSyncOwnerSerialized> | null;
            }>,
        ) => {
            if (payload.owner === null) {
                delete state.suiteSyncOwners[payload.deviceStaticId];
            } else {
                state.suiteSyncOwners[payload.deviceStaticId] = payload.owner;
            }
        },
    },
    extraReducers: builder => {
        builder.addCase(deviceActions.forgetDevice, (state, { payload }) => {
            const staticSessionId = payload.device.state?.staticSessionId;

            if (!staticSessionId) return;

            delete state.suiteSyncOwners[staticSessionId];
            delete state.suiteSyncErrors[staticSessionId];
        });
    },
});

export const {
    updateSuiteSyncEnabled,
    updateSuiteSyncDebugEnabled,
    setSuiteSyncRelayUrl,
    setSuiteSyncError,
    setSuiteSyncOwner,
} = suiteSyncSlice.actions;

export const suiteSyncReducer = suiteSyncSlice.reducer;
