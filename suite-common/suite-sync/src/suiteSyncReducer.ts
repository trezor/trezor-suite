import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { DeviceCancelledErrType, DeviceErrorType } from '@suite-common/wallet-types';

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
    suiteSyncError: DeviceErrorType | DeviceCancelledErrType | null;
};

export const initialSuiteSyncState: SuiteSyncState = {
    settings: {
        isSuiteSyncEnabled: false,
        isSuiteSyncDebugEnabled: false,
        suiteSyncRelayUrl: null,
    },
    suiteSyncError: null,
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
            { payload }: PayloadAction<{ error: DeviceErrorType | DeviceCancelledErrType | null }>,
        ) => {
            state.suiteSyncError = payload.error;
        },
    },
});

export const {
    updateSuiteSyncEnabled,
    updateSuiteSyncDebugEnabled,
    setSuiteSyncRelayUrl,
    setSuiteSyncError,
} = suiteSyncSlice.actions;

export const suiteSyncReducer = suiteSyncSlice.reducer;
