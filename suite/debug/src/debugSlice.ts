import { type PayloadAction } from '@reduxjs/toolkit';

import { createSliceWithExtraDeps } from '@suite-common/redux-utils';

export interface DebugState {
    showDebugMenu: boolean;
}

export type DebugRootState = {
    debug: DebugState;
};

type StorageActionPayload = {
    debug?: DebugState;
};

export const debugInitialState: DebugState = {
    showDebugMenu: false,
};

const debugSlice = createSliceWithExtraDeps({
    name: 'debug',
    initialState: debugInitialState,
    reducers: {
        setShowDebugMenu: (state: DebugState, { payload }: PayloadAction<boolean>) => {
            state.showDebugMenu = payload;
        },
    },
    extraReducers: (builder, extra) => {
        builder.addCase(
            extra.actionTypes.storageLoad,
            (state, { payload }: PayloadAction<StorageActionPayload>) =>
                payload.debug ? { ...state, ...payload.debug } : state,
        );
    },
});

export const debugActions = debugSlice.actions;
export const prepareDebugReducer = debugSlice.prepareReducer;
