import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { type EncryptedHex } from '@suite-common/platform-encryption';
import { type SuiteSyncOwnerSerialized } from '@suite-common/suite-sync-storage';
import { type SuiteSyncFirmwareUpgradeNeededDeviceErrorType } from '@suite-common/suite-sync-types';
import { type DeviceCancelledErrType, type DeviceErrorType } from '@suite-common/suite-types';
import { type StaticSessionId } from '@trezor/connect';

import { type SuiteSyncServerTypeSelectValue } from './server/relayServerSettings';

export type SuiteSyncErrorType =
    | DeviceErrorType
    | DeviceCancelledErrType
    | SuiteSyncFirmwareUpgradeNeededDeviceErrorType;

export type SuiteSyncServer = {
    type: SuiteSyncServerTypeSelectValue;
    customUrl: string | null;
};

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

    suiteSyncServer: SuiteSyncServer;
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
        suiteSyncServer: { type: 'default', customUrl: null },
    },
    suiteSyncErrors: {},
    suiteSyncOwners: {},
};

type SetSuiteSyncErrorAction = PayloadAction<{
    deviceStaticSessionId: StaticSessionId;
    error: SuiteSyncErrorType | null;
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
        },
        updateSuiteSyncDebugEnabled: (
            state,
            { payload }: PayloadAction<{ isEnabled: boolean }>,
        ) => {
            state.settings.isSuiteSyncDebugEnabled = payload.isEnabled;
        },
        setSuiteSyncServer: (state, { payload }: PayloadAction<SuiteSyncServer>) => {
            state.settings.suiteSyncServer = payload;
        },
        setSuiteSyncError: (state, { payload }: SetSuiteSyncErrorAction) => {
            if (payload.error === null) {
                delete state.suiteSyncErrors[payload.deviceStaticSessionId];
            } else {
                state.suiteSyncErrors[payload.deviceStaticSessionId] = payload.error;
            }
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
    setSuiteSyncServer,
    setSuiteSyncError,
    setSuiteSyncOwner,
} = suiteSyncSlice.actions;

export const suiteSyncReducer = suiteSyncSlice.reducer;
