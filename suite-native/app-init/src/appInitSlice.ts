import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';

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
    reducers: {
        postOnboardingInitStarted: (state: AppInitState) => {
            state.connectAndBlockchainInitializationStatus =
                ConnectAndBlockchainInitializationStatus.Pending;
        },
        postOnboardingInitFinished: (
            state: AppInitState,
            { payload }: PayloadAction<ConnectAndBlockchainInitializationResult>,
        ) => {
            state.connectAndBlockchainInitializationStatus = payload;
        },
        applicationInitFinished: (state: AppInitState) => {
            state.isAppInitFinished = true;
        },
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

export const appInitActions = appInitSlice.actions;
