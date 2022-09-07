import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';

export const actionPrefix = '@devices';

export type DevicesState = TrezorDevice[];

const initialState: DevicesState = [];

export type DevicesRootState = {
    devices: DevicesState;
};

const devicesSlice = createSlice({
    name: actionPrefix,
    initialState,
    reducers: {
        createDevice: (state, action: PayloadAction<TrezorDevice>) => {
            state.push(action.payload);
        },
    },
});

export const selectDeviceById = (deviceId: string) => (state: DevicesRootState) =>
    state.devices.find(device => device.id === deviceId);

export const { createDevice } = devicesSlice.actions;
export const devicesReducer = devicesSlice.reducer;
