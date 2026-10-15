import { createSlice } from '@reduxjs/toolkit';

import { ConnectAndBlockchainInitializationStatus } from './appTypes';
import { applicationInitThunk } from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

type AppInitState = {
    isAppInitFinished: boolean;
    connectAndBlockchainInitializationStatus: ConnectAndBlockchainInitializationStatus;
};

type AppInitRootState = {
    appInit: AppInitState;
};

export const appInitInitialState: AppInitState = {
    isAppInitFinished: false,
    connectAndBlockchainInitializationStatus: ConnectAndBlockchainInitializationStatus.Pending,
};

const appInitSlice = createSlice({
    name: 'appInit',
    initialState: appInitInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(postOnboardingInitThunk.pending, (state: AppInitState) => {
                state.connectAndBlockchainInitializationStatus =
                    ConnectAndBlockchainInitializationStatus.Pending;
            })
            .addCase(postOnboardingInitThunk.fulfilled, (state: AppInitState, { payload }) => {
                state.connectAndBlockchainInitializationStatus = payload;
            })
            .addCase(postOnboardingInitThunk.rejected, (state: AppInitState) => {
                state.connectAndBlockchainInitializationStatus =
                    ConnectAndBlockchainInitializationStatus.Unavailable;
            })
            .addCase(applicationInitThunk.fulfilled, (state: AppInitState) => {
                state.isAppInitFinished = true;
            });
    },
});

export const selectIsAppInitFinished = (state: AppInitRootState) => state.appInit.isAppInitFinished;
export const selectConnectAndBlockchainInitializationStatus = (state: AppInitRootState) =>
    state.appInit.connectAndBlockchainInitializationStatus;

export const selectIsBlockchainInitialized = (state: AppInitRootState): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return status === ConnectAndBlockchainInitializationStatus.Ready;
};

export const selectIsConnectAndBlockchainInitializationPending = (
    state: AppInitRootState,
): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return status === ConnectAndBlockchainInitializationStatus.Pending;
};

export const appInitReducer = appInitSlice.reducer;
