import { PayloadAction } from '@reduxjs/toolkit';

import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    SuiteSyncInteraction,
    SuiteSyncState,
    WithSuiteSyncAndDeviceState,
    initialSuiteSyncState as commonInitialState,
    selectSuiteSyncInteraction,
    suiteSyncReducer,
} from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';

import { Action } from 'src/types/suite';

import { STORAGE } from '../suite/constants';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: StaticSessionId | null;
    settings: {
        /**
         * This is flag, that enables the Suite Sync Feature.
         * On mobile, it is managed by Experimental Features.
         * On desktop, it is managed by Debug Settings.
         *
         * It shall be removed once we release the Suite Sync feature.
         */
        isFeatureSuiteSyncAvailable: boolean;
    };
};

export const initialSuiteSyncState: DesktopSuiteSyncState = {
    ...commonInitialState,
    showEnableSuiteSyncModal: null,
    settings: {
        ...commonInitialState.settings,
        isFeatureSuiteSyncAvailable: false,
    },
};

export type DesktopSuiteSyncRootState = {
    suiteSync: DesktopSuiteSyncState;
};

export const suiteSyncSlice = createSliceWithExtraDeps({
    name: 'suiteSync',
    initialState: initialSuiteSyncState,
    reducers: {
        updateShowEnableSuiteSyncModal: (state, action) => {
            state.showEnableSuiteSyncModal = action.payload.deviceStaticSessionId;
        },
        updateIsFeatureSuiteSyncAvailable: (
            state,
            { payload }: PayloadAction<{ isShownInSettings: boolean }>,
        ) => {
            state.settings.isFeatureSuiteSyncAvailable = payload.isShownInSettings;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(STORAGE.LOAD, (state, action) => {
                const actionWithPayload = action as Action;

                if (
                    actionWithPayload.type === STORAGE.LOAD &&
                    actionWithPayload.payload.suiteSyncSettings
                ) {
                    return {
                        ...state,
                        settings: {
                            ...state.settings,
                            ...actionWithPayload.payload.suiteSyncSettings,
                        },
                    } satisfies SuiteSyncState;
                }
            })
            .addDefaultCase((state, action) => {
                suiteSyncReducer(state, action as AnyAction);
            });
    },
});

export const selectIsFeatureSuiteSyncAvailable = (state: DesktopSuiteSyncRootState): boolean =>
    state.suiteSync.settings.isFeatureSuiteSyncAvailable;

export const selectShowEnableSuiteSyncModal = (
    state: DesktopSuiteSyncRootState,
): StaticSessionId | null => state.suiteSync.showEnableSuiteSyncModal;

export const selectDesktopSuiteSyncInteraction = (
    state: DesktopSuiteSyncRootState & WithSuiteSyncAndDeviceState,
    deviceStaticSessionId: StaticSessionId | null,
): SuiteSyncInteraction | null => {
    if (!selectIsFeatureSuiteSyncAvailable(state)) return null;

    return selectSuiteSyncInteraction(state, deviceStaticSessionId);
};

export const { updateShowEnableSuiteSyncModal, updateIsFeatureSuiteSyncAvailable } =
    suiteSyncSlice.actions;
