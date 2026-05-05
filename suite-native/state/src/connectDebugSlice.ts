import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type ConnectDebugState = {
    showConnectLogs: boolean;
};

export type ConnectDebugRootState = {
    connectDebug: ConnectDebugState;
};

const initialState: ConnectDebugState = {
    showConnectLogs: false,
};

export const connectDebugSlice = createSlice({
    name: 'connectDebug',
    initialState,
    reducers: {
        setShowConnectLogs: (state, { payload }: PayloadAction<boolean>) => {
            state.showConnectLogs = payload;
        },
    },
});

export const selectShowConnectLogs = (state: ConnectDebugRootState) =>
    state.connectDebug.showConnectLogs;

export const { setShowConnectLogs } = connectDebugSlice.actions;
export const connectDebugReducer = connectDebugSlice.reducer;
