import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { ConfirmKey } from './types';

export interface BackupState {
    userConfirmed: ConfirmKey[];
    inProgress: boolean;
    error?: string;
}

const initialState: BackupState = {
    userConfirmed: [],
    inProgress: false,
};

export const backupSlice = createSlice({
    name: 'backup',
    initialState,
    reducers: {
        toggleCheckboxByKey: (state, { payload }: PayloadAction<ConfirmKey>) => {
            if (!state.userConfirmed.includes(payload)) {
                state.userConfirmed.push(payload);

                return;
            }
            state.userConfirmed.splice(
                state.userConfirmed.findIndex(r => r === payload),
                1,
            );
        },
        setInProgress: (state, { payload }: PayloadAction<boolean>) => {
            state.inProgress = payload;
        },
        setError: (state, { payload }: PayloadAction<string>) => {
            state.inProgress = false;
            state.error = payload;
        },
        resetReducer: () => initialState,
    },
});

export const backupActions = backupSlice.actions;
export const backupReducer = backupSlice.reducer;
