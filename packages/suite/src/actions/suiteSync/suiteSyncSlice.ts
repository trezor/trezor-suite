import { AnyAction, createSliceWithExtraDeps } from '@suite-common/redux-utils';
import {
    SuiteSyncState,
    initialSuiteSyncState as commonInitialState,
    prepareSuiteSyncReducer,
} from '@suite-common/suite-sync';

import { Action } from 'src/types/suite';

import { STORAGE } from '../suite/constants';

export type DesktopSuiteSyncState = SuiteSyncState & {
    showEnableSuiteSyncModal: boolean;
};

export const initialSuiteSyncState: DesktopSuiteSyncState = {
    ...commonInitialState,
    showEnableSuiteSyncModal: false,
};

export type DesktopSuiteSyncRootState = {
    suiteSync: DesktopSuiteSyncState;
};

export const suiteSyncSlice = createSliceWithExtraDeps({
    name: 'suiteSync',
    initialState: initialSuiteSyncState,
    reducers: {
        updateShowEnableSuiteSyncModal: (state, action) => {
            state.showEnableSuiteSyncModal = action.payload.show;
        },
    },
    extraReducers: (builder, extra) => {
        const commonReducer = prepareSuiteSyncReducer(extra);

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
                commonReducer(state, action as AnyAction);
            });
    },
});

export const { updateShowEnableSuiteSyncModal } = suiteSyncSlice.actions;
