import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type AppServicesInitializationError,
    type AppServicesInitializationResult,
    AppServicesInitializationStatus,
} from './appTypes';
import { applicationInitThunk } from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

type AppState = {
    isAppInitialized: boolean;
    appServicesInitializationStatus: AppServicesInitializationStatus;
};

type AppRootState = {
    app: AppState;
};

export const appSliceInitialState: AppState = {
    isAppInitialized: false,
    appServicesInitializationStatus: AppServicesInitializationStatus.Idle,
};

const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(postOnboardingInitThunk.pending, (state: AppState) => {
                state.appServicesInitializationStatus =
                    AppServicesInitializationStatus.Initializing;
            })
            .addCase(
                postOnboardingInitThunk.fulfilled,
                (state: AppState, { payload }: PayloadAction<AppServicesInitializationResult>) => {
                    state.appServicesInitializationStatus = payload;
                },
            )
            .addCase(
                postOnboardingInitThunk.rejected,
                (
                    state: AppState,
                    { payload }: PayloadAction<AppServicesInitializationError | undefined>,
                ) => {
                    state.appServicesInitializationStatus =
                        payload ?? AppServicesInitializationStatus.Error;
                },
            )
            .addCase(applicationInitThunk.fulfilled, (state: AppState) => {
                state.isAppInitialized = true;
            });
    },
});

export const selectIsAppInitialized = (state: AppRootState) => state.app.isAppInitialized;
export const selectAppServicesInitializationStatus = (state: AppRootState) =>
    state.app.appServicesInitializationStatus;

export const selectCanUseTrezorConnect = (state: AppRootState): boolean => {
    const status = selectAppServicesInitializationStatus(state);

    return (
        status === AppServicesInitializationStatus.Ready ||
        status === AppServicesInitializationStatus.BlockchainError
    );
};

export const selectCanUseBlockchain = (state: AppRootState): boolean =>
    selectAppServicesInitializationStatus(state) === AppServicesInitializationStatus.Ready;

export const appReducer = appSlice.reducer;
