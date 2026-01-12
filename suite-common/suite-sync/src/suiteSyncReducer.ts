import { createReducer } from '@reduxjs/toolkit';

import { setSuiteSyncRelayUrl, suiteSyncActions } from './suiteSyncActions';

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

export const suiteSyncReducer = createReducer(initialSuiteSyncState, builder =>
    builder
        .addCase(suiteSyncActions.updateSuiteSyncEnabled, (state, { payload }) => {
            state.settings.isSuiteSyncEnabled = payload.isEnabled;
        })
        .addCase(suiteSyncActions.updateSuiteSyncDebugEnabled, (state, { payload }) => {
            state.settings.isSuiteSyncDebugEnabled = payload.isEnabled;
        })
        .addCase(suiteSyncActions.updateIsFeatureSuiteSyncAvailable, (state, { payload }) => {
            state.settings.isFeatureSuiteSyncAvailable = payload.isShownInSettings;
        })
        .addCase(setSuiteSyncRelayUrl, (state, { payload }) => {
            state.settings.suiteSyncRelayUrl = payload.url;
        }),
);
