import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NativeFirmwareState {
    isFirmwareInstallationRunning: boolean;
}

const initialState: NativeFirmwareState = {
    isFirmwareInstallationRunning: false,
};

type NativeFirmwareRootState = {
    nativeFirmware: NativeFirmwareState;
};

export const nativeFirmwareSlice = createSlice({
    name: 'nativeFirmware',
    initialState,
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
