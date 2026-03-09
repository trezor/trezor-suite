import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { SeedInputStatus, WordCount } from './types';

export interface RecoveryState {
    advancedRecovery: boolean;
    wordsCount: WordCount;
    status: SeedInputStatus;
    error?: string;
}

const initialState: RecoveryState = {
    advancedRecovery: false,
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
        setAdvancedRecovery: (state, { payload }: PayloadAction<boolean>) => {
            state.advancedRecovery = payload;
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
