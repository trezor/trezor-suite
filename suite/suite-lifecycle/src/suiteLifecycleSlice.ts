import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type SuiteLifecycleState = {
    online: boolean;
};

export type SuiteLifecycleRootState = {
    suiteLifecycle: SuiteLifecycleState;
};

export const suiteLifecycleInitialState: SuiteLifecycleState = {
    online: true,
};

const suiteLifecycleSlice = createSlice({
    name: 'suiteLifecycle',
    initialState: suiteLifecycleInitialState,
    reducers: {
        updateOnlineStatus(state: SuiteLifecycleState, { payload }: PayloadAction<boolean>) {
            state.online = payload;
        },
    },
});

export const { updateOnlineStatus } = suiteLifecycleSlice.actions;
export const suiteLifecycleReducer = suiteLifecycleSlice.reducer;

export const selectIsSuiteOnline = (state: SuiteLifecycleRootState) => state.suiteLifecycle.online;
