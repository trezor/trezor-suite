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
};

export const initialSuiteSyncState: DesktopSuiteSyncState = {
    ...commonInitialState,
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

export const { updateShowEnableSuiteSyncModal } = suiteSyncSlice.actions;
