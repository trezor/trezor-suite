import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type SuiteSyncSettings = {
    /**
     * This is flag, that enables the Suite Sync Feature.
     * On mobile, it is managed by Experimental Features.
     * On desktop, it is managed by Debug Settings.
     *
     * It shall be removed once we release the Suite Sync feature.
     */
    isFeatureSuiteSyncAvailable: boolean;

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
};

export const initialSuiteSyncState: SuiteSyncState = {
    settings: {
        isFeatureSuiteSyncAvailable: false,
        isSuiteSyncEnabled: false,
        isSuiteSyncDebugEnabled: false,
        suiteSyncRelayUrl: null,
    },
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
        updateIsFeatureSuiteSyncAvailable: (
            state,
            { payload }: PayloadAction<{ isShownInSettings: boolean }>,
        ) => {
            state.settings.isFeatureSuiteSyncAvailable = payload.isShownInSettings;
        },
        setSuiteSyncRelayUrl: (state, { payload }: PayloadAction<{ url: string | null }>) => {
            state.settings.suiteSyncRelayUrl = payload.url;
        },
    },
});

export const {
    updateSuiteSyncEnabled,
    updateSuiteSyncDebugEnabled,
    updateIsFeatureSuiteSyncAvailable,
    setSuiteSyncRelayUrl,
} = suiteSyncSlice.actions;

export const suiteSyncReducer = suiteSyncSlice.reducer;
