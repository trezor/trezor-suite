import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { applicationInitThunk, postOnboardingInitThunk } from './appInitThunks';
import {
    type PostOnboardingInitializationResult,
    PostOnboardingInitializationStatus,
} from './appTypes';

type AppState = {
    isAppReady: boolean;
    postOnboardingInitializationStatus: PostOnboardingInitializationStatus;
};

type AppRootState = {
    app: AppState;
};

export const appSliceInitialState: AppState = {
    isAppReady: false,
    postOnboardingInitializationStatus: PostOnboardingInitializationStatus.Idle,
};

const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(postOnboardingInitThunk.pending, (state: AppState) => {
                state.postOnboardingInitializationStatus =
                    PostOnboardingInitializationStatus.Initializing;
            })
            .addCase(
                postOnboardingInitThunk.fulfilled,
                (
                    state: AppState,
                    { payload }: PayloadAction<PostOnboardingInitializationResult>,
                ) => {
                    state.postOnboardingInitializationStatus = payload;
                },
            )
            .addCase(postOnboardingInitThunk.rejected, (state: AppState) => {
                state.postOnboardingInitializationStatus = PostOnboardingInitializationStatus.Error;
            })
            .addCase(applicationInitThunk.fulfilled, (state: AppState) => {
                state.isAppReady = true;
            });
    },
});

export const selectIsAppReady = (state: AppRootState) => state.app.isAppReady;
export const selectPostOnboardingInitializationStatus = (state: AppRootState) =>
    state.app.postOnboardingInitializationStatus;

export const selectCanUseAppServices = (state: AppRootState): boolean => {
    const status = selectPostOnboardingInitializationStatus(state);

    switch (status) {
        case PostOnboardingInitializationStatus.Ready:
        case PostOnboardingInitializationStatus.Error:
            // Initialization errors have historically been non-fatal, so preserve the existing
            // fallback behavior after the initialization attempt has finished.
            return true;
        case PostOnboardingInitializationStatus.Idle:
        case PostOnboardingInitializationStatus.Initializing:
        case PostOnboardingInitializationStatus.Disabled:
            return false;
    }
};

export const appReducer = appSlice.reducer;
