import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type RecoveryInputType, type SeedInputStatus, type WordCount } from './types';

export interface RecoveryState {
    recoveryInputType: RecoveryInputType;
    wordsCount: WordCount;
    status: SeedInputStatus;
    error?: string;
}

const initialState: RecoveryState = {
    recoveryInputType: 'standard',
    wordsCount: 12,
    error: undefined,
    status: 'initial',
};

export const recoverySlice = createSlice({
    name: 'recovery',
    initialState,
    reducers: {
        setWordsCount: (state, { payload }: PayloadAction<WordCount>) => {
            state.wordsCount = payload;
        },
        setRecoveryInputType: (state, { payload }: PayloadAction<RecoveryInputType>) => {
            state.recoveryInputType = payload;
        },
        setError: (state, { payload }: PayloadAction<string | undefined>) => {
            state.error = payload;
        },
        setStatus: (state, { payload }: PayloadAction<SeedInputStatus>) => {
            state.status = payload;
        },
        resetReducer: () => initialState,
    },
});

export const recoveryActions = recoverySlice.actions;
export const recoveryReducer = recoverySlice.reducer;
