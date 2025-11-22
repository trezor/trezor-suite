import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { setLocalFirstStorageRelayUrl, suiteSyncActions } from './suiteSyncActions';

export type SuiteSyncSettings = {
    /**
     * This is flag, that enables the Suite Sync Feature.
     * On desktop, it is managed by Experimental Features.
     * On mobile, it is managed by Debug Settings.
     *
     * It shall be removed once we release the Suite Sync feature.
     */
    isFeatureLocalFirstStorageAvailable: boolean;

    /**
     * This is flag to show some extra Debug UI.
     */
    isLocalFirstStorageDebugEnabled: boolean;

    /**
     * This flag enables Suite Sync. It is intended as Switch
     * in the settings, so privacy focused users can simply
     * switch whole feature off.
     */
    isLocalFirstStorageEnabled: boolean;

    /**
     * This is URL for backend/relay.
     *
     * Todo: This is kinda reladed to Evolu, and other libraries
     *       can have different config. So this may better be in some
     *       Provider-Config place in the future.
     */
    localFirstStorageRelayUrl: string | null;
};

export type SuiteSyncState = {
    settings: SuiteSyncSettings;
};

export const initialSuiteSyncState: SuiteSyncState = {
    settings: {
        isFeatureLocalFirstStorageAvailable: false,
        isLocalFirstStorageEnabled: false,
        isLocalFirstStorageDebugEnabled: false,
        localFirstStorageRelayUrl: null,
    },
};

export const prepareSuiteSyncReducer = createReducerWithExtraDeps<SuiteSyncState>(
    initialSuiteSyncState,
    builder =>
        builder
            .addCase(suiteSyncActions.updateLocalFirstStorageEnabled, (state, { payload }) => {
                state.settings.isLocalFirstStorageEnabled = payload.isEnabled;
            })
            .addCase(suiteSyncActions.updateLocalFirstStorageDebugEnabled, (state, { payload }) => {
                state.settings.isLocalFirstStorageDebugEnabled = payload.isEnabled;
            })
            .addCase(
                suiteSyncActions.updateIsFeatureLocalFirstStorageAvailable,
                (state, { payload }) => {
                    state.settings.isFeatureLocalFirstStorageAvailable = payload.isShownInSettings;
                },
            )
            .addCase(setLocalFirstStorageRelayUrl, (state, { payload }) => {
                state.settings.localFirstStorageRelayUrl = payload.url;
            }),
);
