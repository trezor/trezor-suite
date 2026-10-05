import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export enum PostOnboardingInitializationStatus {
    Idle = 'idle',
    Initializing = 'initializing',
    Ready = 'ready',
    Error = 'error',
    Disabled = 'disabled',
}

type AppSliceState = {
    isAppReady: boolean;
    postOnboardingInitializationStatus: PostOnboardingInitializationStatus;
};

type AppSliceRootState = {
    app: AppSliceState;
};

export const appSliceInitialState: AppSliceState = {
    isAppReady: false,
    postOnboardingInitializationStatus: PostOnboardingInitializationStatus.Idle,
};

export const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {
        setIsAppReady: (state, { payload }: PayloadAction<boolean>) => {
            state.isAppReady = payload;
        },
        setPostOnboardingInitializationStatus: (
            state,
            { payload }: PayloadAction<PostOnboardingInitializationStatus>,
        ) => {
            state.postOnboardingInitializationStatus = payload;
        },
    },
});

export const selectIsAppReady = (state: AppSliceRootState) => state.app.isAppReady;
export const selectPostOnboardingInitializationStatus = (state: AppSliceRootState) =>
    state.app.postOnboardingInitializationStatus;
export const selectCanUseAppServices = (state: AppSliceRootState) => {
    const status = selectPostOnboardingInitializationStatus(state);

    // Initialization errors have historically been non-fatal, so preserve the existing fallback
    // behavior while preventing calls from racing an initialization attempt still in progress.
    return (
        status === PostOnboardingInitializationStatus.Ready ||
        status === PostOnboardingInitializationStatus.Error
    );
};

export const { setIsAppReady, setPostOnboardingInitializationStatus } = appSlice.actions;
export const appReducer = appSlice.reducer;
