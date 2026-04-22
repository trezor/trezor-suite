import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { type SuiteSyncFirmwareUpgradeNeededDeviceErrorType } from '@suite-common/suite-sync-types';
import { type DeviceCancelledErrType, type DeviceErrorType } from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect';

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

type SetSuiteSyncErrorAction = PayloadAction<{
    deviceStaticSessionId: StaticSessionId;
    error: SuiteSyncErrorType;
}>;

type ResetSuiteSyncErrorAction = PayloadAction<{
    deviceStaticSessionId: StaticSessionId;
}>;

type SetSuiteSyncOwnerAction = PayloadAction<{
    deviceStaticId: StaticSessionId;
    owner: EncryptedHex<SuiteSyncOwnerSerialized> | null;
}>;

export const suiteSyncSlice = createSlice({
    name: 'suiteSync',
    initialState: initialSuiteSyncState,
    reducers: {
        updateSuiteSyncEnabled: (state, { payload }: PayloadAction<{ isEnabled: boolean }>) => {
            state.settings.isSuiteSyncEnabled = payload.isEnabled;

            if (!payload.isEnabled) {
                state.suiteSyncErrors = {};
                state.suiteSyncOwners = {};
            }
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
        setSuiteSyncError: (state, { payload }: SetSuiteSyncErrorAction) => {
            state.suiteSyncErrors[payload.deviceStaticSessionId] = payload.error;
        },
        resetSuiteSyncError: (state, { payload }: ResetSuiteSyncErrorAction) => {
            delete state.suiteSyncErrors[payload.deviceStaticSessionId];
        },
        setSuiteSyncOwner: (state, { payload }: SetSuiteSyncOwnerAction) => {
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
    resetSuiteSyncError,
    setSuiteSyncOwner,
} = suiteSyncSlice.actions;

export const suiteSyncReducer = suiteSyncSlice.reducer;
