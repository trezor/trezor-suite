import { PayloadAction, createSlice } from '@reduxjs/toolkit';

type AppSliceState = {
    isConnectInitialized: boolean;
    isAppReady: boolean;
};

type AppSliceRootState = {
    app: AppSliceState;
};

const appSliceInitialState: AppSliceState = {
    isAppReady: false,
    isConnectInitialized: false,
};

export const appSlice = createSlice({
    name: 'app',
    initialState: appSliceInitialState,
    reducers: {
        setIsConnectInitialized: (state, { payload }: PayloadAction<boolean>) => {
            state.isConnectInitialized = payload;
        },
        setIsAppReady: (state, { payload }: PayloadAction<boolean>) => {
            state.isAppReady = payload;
        },
    },
});

export const selectIsAppReady = (state: AppSliceRootState) => state.app.isAppReady;
export const selectIsConnectInitialized = (state: AppSliceRootState) =>
    state.app.isConnectInitialized;

export const { setIsConnectInitialized, setIsAppReady } = appSlice.actions;
export const appReducer = appSlice.reducer;
