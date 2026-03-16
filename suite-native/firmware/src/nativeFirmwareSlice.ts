import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export interface NativeFirmwareState {
    isFirmwareInstallationRunning: boolean;
}

export const nativeFirmwareInitialState: NativeFirmwareState = {
    isFirmwareInstallationRunning: false,
};

export type NativeFirmwareRootState = {
    nativeFirmware: NativeFirmwareState;
};

export const nativeFirmwareSlice = createSlice({
    name: 'nativeFirmware',
    initialState: nativeFirmwareInitialState,
    reducers: {
        setIsFirmwareInstallationRunning: (state, action: PayloadAction<boolean>) => {
            state.isFirmwareInstallationRunning = action.payload;
        },
    },
});

export const nativeFirmwareActions = nativeFirmwareSlice.actions;
export const nativeFirmwareReducer = nativeFirmwareSlice.reducer;

export const selectIsFirmwareInstallationRunning = (state: NativeFirmwareRootState) =>
    state.nativeFirmware.isFirmwareInstallationRunning;
