import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type ConnectAndBlockchainInitializationError,
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';
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
    connectAndBlockchainInitializationStatus: ConnectAndBlockchainInitializationStatus.Idle,
};

const initializationReadinessByStatus: Record<
    ConnectAndBlockchainInitializationStatus,
    { isTrezorConnectInitialized: boolean; isBlockchainInitialized: boolean }
> = {
    [ConnectAndBlockchainInitializationStatus.Idle]: {
        isTrezorConnectInitialized: false,
        isBlockchainInitialized: false,
    },
    [ConnectAndBlockchainInitializationStatus.Initializing]: {
        isTrezorConnectInitialized: false,
        isBlockchainInitialized: false,
    },
    [ConnectAndBlockchainInitializationStatus.Ready]: {
        isTrezorConnectInitialized: true,
        isBlockchainInitialized: true,
    },
    [ConnectAndBlockchainInitializationStatus.ConnectError]: {
        isTrezorConnectInitialized: false,
        isBlockchainInitialized: false,
    },
    [ConnectAndBlockchainInitializationStatus.BlockchainError]: {
        isTrezorConnectInitialized: true,
        isBlockchainInitialized: false,
    },
    [ConnectAndBlockchainInitializationStatus.Error]: {
        isTrezorConnectInitialized: false,
        isBlockchainInitialized: false,
    },
    [ConnectAndBlockchainInitializationStatus.Disabled]: {
        isTrezorConnectInitialized: false,
        isBlockchainInitialized: false,
    },
};

const appInitSlice = createSlice({
    name: 'appInit',
    initialState: appInitInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(postOnboardingInitThunk.pending, (state: AppInitState) => {
                state.connectAndBlockchainInitializationStatus =
                    ConnectAndBlockchainInitializationStatus.Initializing;
            })
            .addCase(
                postOnboardingInitThunk.fulfilled,
                (
                    state: AppInitState,
                    { payload }: PayloadAction<ConnectAndBlockchainInitializationResult>,
                ) => {
                    state.connectAndBlockchainInitializationStatus = payload;
                },
            )
            .addCase(
                postOnboardingInitThunk.rejected,
                (
                    state: AppInitState,
                    { payload }: PayloadAction<ConnectAndBlockchainInitializationError | undefined>,
                ) => {
                    state.connectAndBlockchainInitializationStatus =
                        payload ?? ConnectAndBlockchainInitializationStatus.Error;
                },
            )
            .addCase(applicationInitThunk.fulfilled, (state: AppInitState) => {
                state.isAppInitFinished = true;
            });
    },
});

export const selectIsAppInitFinished = (state: AppInitRootState) => state.appInit.isAppInitFinished;
export const selectConnectAndBlockchainInitializationStatus = (state: AppInitRootState) =>
    state.appInit.connectAndBlockchainInitializationStatus;

export const selectIsTrezorConnectInitialized = (state: AppInitRootState): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return initializationReadinessByStatus[status].isTrezorConnectInitialized;
};

export const selectIsBlockchainInitialized = (state: AppInitRootState): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return initializationReadinessByStatus[status].isBlockchainInitialized;
};

export const selectIsConnectAndBlockchainInitializationPending = (
    state: AppInitRootState,
): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return (
        status === ConnectAndBlockchainInitializationStatus.Idle ||
        status === ConnectAndBlockchainInitializationStatus.Initializing
    );
};

export const appInitReducer = appInitSlice.reducer;
