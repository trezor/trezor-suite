import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const actionPrefix = '@devices';

// FIXME: fix in a follow up task with regular imported type from TrezorDevice
type DummyImportedDevice = {
    type: 'imported';
    id: string | null;
    label: string;
    status: 'available';
    mode: 'normal';
    state?: string;
};

export type DevicesState = DummyImportedDevice[];

const initialState: DevicesState = [];

export type DevicesRootState = {
    devices: DevicesState;
};

const devicesSlice = createSlice({
    name: actionPrefix,
    initialState,
    reducers: {
        createDevice: (state, action: PayloadAction<DummyImportedDevice>) => {
            state.push(action.payload);
        },
    },
});

export const selectDeviceById = (deviceId: string) => (state: DevicesRootState) =>
    state.devices.find(device => device.id === deviceId);

export const { createDevice } = devicesSlice.actions;
export const devicesReducer = devicesSlice.reducer;
