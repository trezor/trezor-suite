import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type ConnectAndBlockchainInitializationError,
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';
import { applicationInitThunk } from './applicationInitThunk';
import { postOnboardingInitThunk } from './postOnboardingInitThunk';

type AppState = {
    isAppInitialized: boolean;
    connectAndBlockchainInitializationStatus: ConnectAndBlockchainInitializationStatus;
};

type AppRootState = {
    app: AppState;
};

export const appSliceInitialState: AppState = {
    isAppInitialized: false,
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

const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(postOnboardingInitThunk.pending, (state: AppState) => {
                state.connectAndBlockchainInitializationStatus =
                    ConnectAndBlockchainInitializationStatus.Initializing;
            })
            .addCase(
                postOnboardingInitThunk.fulfilled,
                (
                    state: AppState,
                    { payload }: PayloadAction<ConnectAndBlockchainInitializationResult>,
                ) => {
                    state.connectAndBlockchainInitializationStatus = payload;
                },
            )
            .addCase(
                postOnboardingInitThunk.rejected,
                (
                    state: AppState,
                    { payload }: PayloadAction<ConnectAndBlockchainInitializationError | undefined>,
                ) => {
                    state.connectAndBlockchainInitializationStatus =
                        payload ?? ConnectAndBlockchainInitializationStatus.Error;
                },
            )
            .addCase(applicationInitThunk.fulfilled, (state: AppState) => {
                state.isAppInitialized = true;
            });
    },
});

export const selectIsAppInitialized = (state: AppRootState) => state.app.isAppInitialized;
export const selectConnectAndBlockchainInitializationStatus = (state: AppRootState) =>
    state.app.connectAndBlockchainInitializationStatus;

export const selectIsTrezorConnectInitialized = (state: AppRootState): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return initializationReadinessByStatus[status].isTrezorConnectInitialized;
};

export const selectIsBlockchainInitialized = (state: AppRootState): boolean => {
    const status = selectConnectAndBlockchainInitializationStatus(state);

    return initializationReadinessByStatus[status].isBlockchainInitialized;
};

export const appReducer = appSlice.reducer;
