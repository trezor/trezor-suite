import { PayloadAction } from '@reduxjs/toolkit';

import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    SuiteSyncState,
    initialSuiteSyncState as commonInitialState,
    suiteSyncReducer,
} from '@suite-common/suite-sync';
import { StaticSessionId } from '@trezor/connect';

import { Action } from 'src/types/suite';

import { STORAGE } from '../suite/constants';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: StaticSessionId | null;
    /**
     * This is flag, that enables the Suite Sync Feature.
     * On mobile, it is managed by Experimental Features.
     * On desktop, it is managed by Debug Settings.
     *
     * It shall be removed once we release the Suite Sync feature.
     */
    isFeatureSuiteSyncAvailable: boolean;
};

export const initialSuiteSyncState: DesktopSuiteSyncState = {
    ...commonInitialState,
    isFeatureSuiteSyncAvailable: false,
    showEnableSuiteSyncModal: null,
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
            state.isFeatureSuiteSyncAvailable = payload.isShownInSettings;
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
    state.suiteSync.isFeatureSuiteSyncAvailable;

export const { updateShowEnableSuiteSyncModal, updateIsFeatureSuiteSyncAvailable } =
    suiteSyncSlice.actions;
