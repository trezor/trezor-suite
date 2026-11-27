import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type StorageCorruptedPayload,
    type StorageErrorPayload,
    storageCorrupted,
    storageError,
} from './storageLifecycleActions';

export type SuiteLifecycle =
    | { status: 'initial' }
    | { status: 'loading' }
    | { status: 'ready' }
    // errors set from connect, should be renamed
    | { status: 'error'; error: string }
    // blocked if the instance cannot upgrade due to older version running,
    // blocking in case instance is running older version thus blocking other instance
    | { status: 'db-error'; error: StorageErrorPayload }
    // inconsistent IDB state detected, need to reset storage
    | { status: 'db-corrupted'; error: StorageCorruptedPayload };

export type SuiteLifecycleState = {
    online: boolean;
    lifecycle: SuiteLifecycle;
};

export type SuiteLifecycleRootState = {
    suiteLifecycle: SuiteLifecycleState;
};

export const suiteLifecycleInitialState: SuiteLifecycleState = {
    online: true,
    lifecycle: { status: 'initial' },
};

const suiteLifecycleSlice = createSlice({
    name: 'suiteLifecycle',
    initialState: suiteLifecycleInitialState,
    reducers: {
        onSuiteInit(state: SuiteLifecycleState) {
            state.lifecycle = { status: 'loading' };
        },
        onSuiteReady(state: SuiteLifecycleState) {
            state.lifecycle = { status: 'ready' };
        },
        setSuiteError(state: SuiteLifecycleState, { payload }: PayloadAction<string>) {
            state.lifecycle = { status: 'error', error: payload };
        },
        updateOnlineStatus(state: SuiteLifecycleState, { payload }: PayloadAction<boolean>) {
            state.online = payload;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(storageError, (state: SuiteLifecycleState, { payload }) => {
                state.lifecycle = { status: 'db-error', error: payload };
            })
            .addCase(storageCorrupted, (state: SuiteLifecycleState, { payload }) => {
                state.lifecycle = { status: 'db-corrupted', error: payload };
            });
    },
});

export const { onSuiteInit, onSuiteReady, setSuiteError, updateOnlineStatus } =
    suiteLifecycleSlice.actions;
export const suiteLifecycleReducer = suiteLifecycleSlice.reducer;

export const selectIsSuiteOnline = (state: SuiteLifecycleRootState) => state.suiteLifecycle.online;
export const selectSuiteLifecycle = (state: SuiteLifecycleRootState) =>
    state.suiteLifecycle.lifecycle;
export const selectSuiteLifecycleStatus = (state: SuiteLifecycleRootState) =>
    state.suiteLifecycle.lifecycle.status;
